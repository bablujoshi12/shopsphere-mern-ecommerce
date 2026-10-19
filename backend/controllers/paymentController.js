const crypto = require("crypto");

const razorpay = require("../utils/razorpay");
const Cart = require("../model/Cart");
const Order = require("../model/Order");
const Product = require("../model/Product");
const Coupon = require("../model/Coupon");
const ExpressError = require("../utils/ExpressError");

// Calculate cart and capture prices at checkout.
const calculateCart = async (cart) => {
  let subtotal = 0;
  let discount = 0;
  let eligibleAmount = 0;

  const orderItems = [];

  for (const item of cart.items) {
    const product = item.product;

    if (!product || !product.isActive) {
      throw new ExpressError(400, "A product in your cart is unavailable");
    }

    if (
      !Number.isInteger(item.quantity) ||
      item.quantity < 1 ||
      product.stock < item.quantity
    ) {
      throw new ExpressError(
        400,
        `${product.name} is out of stock or quantity is invalid`,
      );
    }

    if (
      typeof product.costPrice !== "number" ||
      !Number.isFinite(product.costPrice) ||
      product.costPrice < 0
    ) {
      throw new ExpressError(
        400,
        `Purchase cost is missing for ${product.name}`,
      );
    }

    const originalPrice = product.price;

    const finalPrice =
      product.discountPrice != null && product.discountPrice < product.price
        ? product.discountPrice
        : product.price;

    subtotal += originalPrice * item.quantity;
    discount += (originalPrice - finalPrice) * item.quantity;
    eligibleAmount += finalPrice * item.quantity;

    orderItems.push({
      product: product._id,
      name: product.name,
      image: product.images?.[0] || "",
      price: finalPrice,
      costPriceSnapshot: product.costPrice,
      quantity: item.quantity,
    });
  }

  return { subtotal, discount, eligibleAmount, orderItems };
};

// Validate coupon and calculate discount.
const calculateCouponDiscount = async (code, eligibleAmount) => {
  if (!code) {
    return {
      coupon: null,
      couponCode: "",
      couponDiscount: 0,
    };
  }

  if (typeof code !== "string" || code.trim().length > 50) {
    throw new ExpressError(400, "Invalid coupon code");
  }

  const couponCode = code.trim().toUpperCase();
  const coupon = await Coupon.findOne({ code: couponCode });

  if (!coupon) {
    throw new ExpressError(400, "Invalid coupon code");
  }

  if (!coupon.isActive) {
    throw new ExpressError(400, "This coupon is inactive");
  }

  if (new Date(coupon.expiryDate) <= new Date()) {
    throw new ExpressError(400, "This coupon has expired");
  }

  if (coupon.usedCount >= coupon.usageLimit) {
    throw new ExpressError(400, "Coupon usage limit reached");
  }

  if (eligibleAmount < coupon.minOrderAmount) {
    throw new ExpressError(
      400,
      `Minimum order amount is ₹${coupon.minOrderAmount}`,
    );
  }

  let couponDiscount;

  if (coupon.discountType === "percentage") {
    couponDiscount = (eligibleAmount * coupon.discountValue) / 100;

    if (coupon.maxDiscount != null) {
      couponDiscount = Math.min(couponDiscount, coupon.maxDiscount);
    }
  } else {
    couponDiscount = coupon.discountValue;
  }

  couponDiscount = Math.min(couponDiscount, eligibleAmount);
  couponDiscount = Math.round(couponDiscount * 100) / 100;

  return {
    coupon,
    couponCode: coupon.code,
    couponDiscount,
  };
};

// Create Razorpay checkout order.
const createRazorpayOrder = async (req, res) => {
  try {
    const { couponCode = "" } = req.body;

    const cart = await Cart.findOne({
      user: req.user._id,
    }).populate("items.product");

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Your cart is empty",
      });
    }

    const { eligibleAmount } = await calculateCart(cart);

    const { couponCode: normalizedCouponCode, couponDiscount } =
      await calculateCouponDiscount(couponCode, eligibleAmount);

    const shippingCharge = 0;

    const total = Math.max(
      0,
      Math.round((eligibleAmount - couponDiscount + shippingCharge) * 100) /
        100,
    );

    if (total <= 0) {
      return res.status(400).json({
        success: false,
        message: "Order amount must be greater than zero",
      });
    }

    const razorpayOrder = await razorpay.orders.create({
      amount: Math.round(total * 100),
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
      notes: {
        userId: String(req.user._id),
        couponCode: normalizedCouponCode,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Razorpay order created successfully",
      order: razorpayOrder,
      pricing: {
        eligibleAmount,
        couponCode: normalizedCouponCode,
        couponDiscount,
        shippingCharge,
        total,
      },
    });
  } catch (err) {
    console.error("Razorpay order error:", err);

    return res.status(err.statusCode || 500).json({
      success: false,
      message: err.statusCode ? err.message : "Failed to create Razorpay order",
    });
  }
};

// Verify payment and create the ShopSphere order.
const verifyRazorpayPayment = async (req, res) => {
  let reservedItems = [];
  let claimedCouponId = null;
  let orderCreated = false;

  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      shippingAddress,
    } = req.body;

    if (
      !razorpay_order_id ||
      !razorpay_payment_id ||
      !razorpay_signature ||
      !shippingAddress
    ) {
      return res.status(400).json({
        success: false,
        message: "Payment details and shipping address are required",
      });
    }

    // Verify Razorpay signature.
    const secret = process.env.RAZORPAY_KEY_SECRET;

    if (!secret) {
      throw new ExpressError(500, "Razorpay secret is not configured");
    }

    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    const expected = Buffer.from(expectedSignature, "hex");
    const received = Buffer.from(razorpay_signature, "hex");

    if (
      expected.length !== received.length ||
      !crypto.timingSafeEqual(expected, received)
    ) {
      return res.status(400).json({
        success: false,
        message: "Payment verification failed",
      });
    }

    // Check whether this payment already has an order.
    const existingOrder = await Order.findOne({
      razorpayPaymentId: razorpay_payment_id,
    });

    if (existingOrder) {
      if (
        String(existingOrder.user) !== String(req.user._id) ||
        existingOrder.razorpayOrderId !== razorpay_order_id
      ) {
        return res.status(409).json({
          success: false,
          message: "This payment is already linked to another order",
        });
      }

      return res.status(200).json({
        success: true,
        message: "Payment was already verified",
        order: existingOrder,
      });
    }

    // Verify Razorpay order ownership.
    const razorpayOrder = await razorpay.orders.fetch(razorpay_order_id);

    if (razorpayOrder.notes?.userId !== String(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: "This payment order does not belong to you",
      });
    }

    // Confirm payment directly with Razorpay.
    const payment = await razorpay.payments.fetch(razorpay_payment_id);

    if (
      payment.order_id !== razorpay_order_id ||
      payment.status !== "captured" ||
      payment.currency !== "INR" ||
      payment.amount !== razorpayOrder.amount ||
      razorpayOrder.currency !== "INR"
    ) {
      return res.status(400).json({
        success: false,
        message: "Payment has not been confirmed",
      });
    }

    const cart = await Cart.findOne({
      user: req.user._id,
    }).populate("items.product");

    if (!cart || cart.items.length === 0) {
      return res.status(409).json({
        success: false,
        message:
          "Payment is captured but your cart is empty. Contact support for order assistance.",
      });
    }

    const { subtotal, discount, eligibleAmount, orderItems } =
      await calculateCart(cart);

    // Use the coupon saved when the Razorpay order was created.
    const couponCode = razorpayOrder.notes?.couponCode || "";

    const {
      coupon,
      couponCode: normalizedCouponCode,
      couponDiscount,
    } = await calculateCouponDiscount(couponCode, eligibleAmount);

    const shippingCharge = 0;

    const totalAmount = Math.max(
      0,
      Math.round((eligibleAmount - couponDiscount + shippingCharge) * 100) /
        100,
    );

    if (
      payment.amount !== Math.round(totalAmount * 100) ||
      razorpayOrder.amount !== Math.round(totalAmount * 100)
    ) {
      return res.status(400).json({
        success: false,
        message: "Payment amount does not match the order total",
      });
    }

    // Claim coupon usage atomically.
    if (coupon) {
      const claimedCoupon = await Coupon.findOneAndUpdate(
        {
          _id: coupon._id,
          isActive: true,
          expiryDate: { $gt: new Date() },
          $expr: {
            $lt: ["$usedCount", "$usageLimit"],
          },
        },
        {
          $inc: { usedCount: 1 },
        },
        { new: true },
      );

      if (!claimedCoupon) {
        return res.status(409).json({
          success: false,
          message:
            "Payment was captured, but the coupon is no longer available. Contact support.",
        });
      }

      claimedCouponId = coupon._id;
    }

    // Reserve stock with conditional updates.
    for (const item of cart.items) {
      const updatedProduct = await Product.findOneAndUpdate(
        {
          _id: item.product._id,
          stock: { $gte: item.quantity },
          isActive: true,
        },
        {
          $inc: { stock: -item.quantity },
        },
        { new: true },
      );

      if (!updatedProduct) {
        throw new ExpressError(
          409,
          "Payment was captured, but product stock changed. Contact support for order assistance.",
        );
      }

      reservedItems.push({
        product: item.product._id,
        quantity: item.quantity,
      });
    }

    // Create the order. Unique index prevents duplicate payment IDs.
    const order = await Order.create({
      user: req.user._id,
      items: orderItems,
      shippingAddress,
      paymentMethod: "Razorpay",
      paymentStatus: "paid",
      orderStatus: "confirmed",
      subtotal,
      discount,
      couponCode: normalizedCouponCode,
      couponDiscount,
      shippingCharge,
      totalAmount,
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
    });

    orderCreated = true;

    // Clearing the cart is a separate operation. Do not undo a paid
    // order if cart clearing fails.
    try {
      cart.items = [];
      await cart.save();
    } catch (cartError) {
      console.error("Order created but cart clearing failed:", cartError);
    }

    return res.status(201).json({
      success: true,
      message: "Payment verified and order placed successfully",
      order,
    });
  } catch (err) {
    console.error("Payment verification error:", err);

    // If the order was saved, do not reverse stock or coupon usage.
    if (!orderCreated) {
      // Restore stock reserved by this request.
      for (const item of reservedItems) {
        try {
          await Product.findByIdAndUpdate(item.product, {
            $inc: { stock: item.quantity },
          });
        } catch (restoreError) {
          console.error("Stock restoration failed:", restoreError);
        }
      }

      // Release coupon usage claimed by this request.
      if (claimedCouponId) {
        try {
          await Coupon.findOneAndUpdate(
            {
              _id: claimedCouponId,
              usedCount: { $gt: 0 },
            },
            {
              $inc: { usedCount: -1 },
            },
          );
        } catch (couponError) {
          console.error("Coupon restoration failed:", couponError);
        }
      }
    }

    // Handle a concurrent request that saved the same payment first.
    if (err.code === 11000) {
      try {
        const existingOrder = await Order.findOne({
          razorpayPaymentId: req.body?.razorpay_payment_id,
        });

        if (
          existingOrder &&
          String(existingOrder.user) === String(req.user._id) &&
          existingOrder.razorpayOrderId === req.body?.razorpay_order_id
        ) {
          return res.status(200).json({
            success: true,
            message: "Payment was already verified",
            order: existingOrder,
          });
        }
      } catch (lookupError) {
        console.error("Duplicate payment lookup failed:", lookupError);
      }
    }

    return res.status(err.statusCode || 500).json({
      success: false,
      message: err.statusCode
        ? err.message
        : "Unable to verify payment or create order. If payment was deducted, contact support.",
    });
  }
};

module.exports = {
  createRazorpayOrder,
  verifyRazorpayPayment,
};
