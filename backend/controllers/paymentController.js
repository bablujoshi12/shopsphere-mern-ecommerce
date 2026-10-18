const crypto = require("crypto");

const razorpay = require("../utils/razorpay");
const Cart = require("../model/Cart");
const Order = require("../model/Order");
const Product = require("../model/Product");
const Coupon = require("../model/Coupon");

const ExpressError = require("../utils/ExpressError");

// Calculate cart prices and validate products
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

    const originalPrice = product.price;

    const finalPrice =
      product.discountPrice && product.discountPrice < product.price
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
      quantity: item.quantity,
    });
  }

  return {
    subtotal,
    discount,
    eligibleAmount,
    orderItems,
  };
};

// Validate and calculate coupon discount
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

  const coupon = await Coupon.findOne({
    code: couponCode,
  });

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

  let couponDiscount = 0;

  if (coupon.discountType === "percentage") {
    couponDiscount = (eligibleAmount * coupon.discountValue) / 100;

    if (coupon.maxDiscount !== null && coupon.maxDiscount !== undefined) {
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

// Create Razorpay Order
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

    const {
      coupon,
      couponCode: normalizedCouponCode,
      couponDiscount,
    } = await calculateCouponDiscount(couponCode, eligibleAmount);

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

// Verify Payment and Create ShopSphere Order
const verifyRazorpayPayment = async (req, res) => {
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

    // Verify Razorpay signature
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
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

    // Fetch Razorpay order and confirm its owner
    const razorpayOrder = await razorpay.orders.fetch(razorpay_order_id);

    if (razorpayOrder.notes?.userId !== String(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: "This payment order does not belong to you",
      });
    }

    // Confirm payment status and amount with Razorpay
    const payment = await razorpay.payments.fetch(razorpay_payment_id);

    if (
      payment.order_id !== razorpay_order_id ||
      payment.status !== "captured" ||
      payment.currency !== "INR" ||
      payment.amount !== razorpayOrder.amount
    ) {
      return res.status(400).json({
        success: false,
        message: "Payment has not been confirmed",
      });
    }

    // Prevent creating a duplicate order for the same payment
    const existingOrder = await Order.findOne({
      razorpayPaymentId: razorpay_payment_id,
    });

    if (existingOrder) {
      return res.status(200).json({
        success: true,
        message: "Payment was already verified",
        order: existingOrder,
      });
    }

    const cart = await Cart.findOne({
      user: req.user._id,
    }).populate("items.product");

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Your cart is empty",
      });
    }

    const { subtotal, discount, eligibleAmount, orderItems } =
      await calculateCart(cart);

    // Use the coupon saved in Razorpay order notes, not a new
    // coupon code supplied during payment verification.
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

    // Claim coupon usage atomically before creating the order.
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
          $inc: {
            usedCount: 1,
          },
        },
        { new: true },
      );

      if (!claimedCoupon) {
        return res.status(409).json({
          success: false,
          message:
            "This coupon is no longer available. Please contact support for payment assistance.",
        });
      }
    }

    // Reserve stock safely before saving the order.
    const reservedItems = [];

    for (const item of cart.items) {
      const updatedProduct = await Product.findOneAndUpdate(
        {
          _id: item.product._id,
          stock: { $gte: item.quantity },
          isActive: true,
        },
        {
          $inc: {
            stock: -item.quantity,
          },
        },
        { new: true },
      );

      if (!updatedProduct) {
        for (const reservedItem of reservedItems) {
          await Product.findByIdAndUpdate(reservedItem.product, {
            $inc: {
              stock: reservedItem.quantity,
            },
          });
        }

        if (coupon) {
          await Coupon.findOneAndUpdate(
            {
              _id: coupon._id,
              usedCount: { $gt: 0 },
            },
            {
              $inc: {
                usedCount: -1,
              },
            },
          );
        }

        return res.status(409).json({
          success: false,
          message:
            "Product stock changed during payment. Please contact support if your payment was deducted.",
        });
      }

      reservedItems.push({
        product: item.product._id,
        quantity: item.quantity,
      });
    }

    let order;

    try {
      order = await Order.create({
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

      // Clear cart after successful order creation.
      cart.items = [];
      await cart.save();
    } catch (error) {
      // Compensate stock and coupon usage if saving the order fails.
      for (const reservedItem of reservedItems) {
        await Product.findByIdAndUpdate(reservedItem.product, {
          $inc: {
            stock: reservedItem.quantity,
          },
        });
      }

      if (coupon) {
        await Coupon.findOneAndUpdate(
          {
            _id: coupon._id,
            usedCount: { $gt: 0 },
          },
          {
            $inc: {
              usedCount: -1,
            },
          },
        );
      }

      throw error;
    }

    return res.status(201).json({
      success: true,
      message: "Payment verified and order placed successfully",
      order,
    });
  } catch (err) {
    console.error("Payment verification error:", err);

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
