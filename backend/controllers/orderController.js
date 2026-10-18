const Order = require("../model/Order");
const Cart = require("../model/Cart");
const Product = require("../model/Product");
const User = require("../model/User");
const Coupon = require("../model/Coupon");
const ExpressError = require("../utils/ExpressError");
const wrapAsync = require("../utils/wrapAsync");

// Create order with optional coupon support
const createOrder = wrapAsync(async (req, res, next) => {
  const user = await User.findById(req.user._id);

  if (!user) {
    return next(new ExpressError(404, "user not found"));
  }

  const { shippingAddress, paymentMethod } = req.body;
  const rawCouponCode = req.body.couponCode;

  if (!shippingAddress || !paymentMethod) {
    return next(
      new ExpressError(400, "shippingAddress and paymentMethod are required"),
    );
  }

  if (!["COD", "Razorpay"].includes(paymentMethod)) {
    return next(new ExpressError(400, "invalid payment method"));
  }

  if (
    rawCouponCode !== undefined &&
    (typeof rawCouponCode !== "string" || rawCouponCode.trim().length > 50)
  ) {
    return next(new ExpressError(400, "invalid coupon code"));
  }

  const couponCode =
    typeof rawCouponCode === "string" ? rawCouponCode.trim().toUpperCase() : "";

  const cart = await Cart.findOne({
    user: req.user._id,
  }).populate("items.product");

  if (!cart || cart.items.length === 0) {
    return next(new ExpressError(400, "cart is empty"));
  }

  const orderItems = [];
  let subtotal = 0;
  let discount = 0;
  let eligibleAmount = 0;

  for (const item of cart.items) {
    const product = await Product.findById(item.product._id);

    if (!product) {
      return next(new ExpressError(404, "product not found"));
    }

    if (!product.isActive) {
      return next(new ExpressError(400, `${product.name} is not available`));
    }

    if (product.stock < item.quantity) {
      return next(
        new ExpressError(
          400,
          `${product.name} has only ${product.stock} items in stock`,
        ),
      );
    }

    // Ensure product cost exists for accurate profit calculation.
    if (
      typeof product.costPrice !== "number" ||
      !Number.isFinite(product.costPrice) ||
      product.costPrice < 0
    ) {
      return next(
        new ExpressError(
          400,
          `Purchase cost is missing for ${product.name}. Please update the product cost first.`,
        ),
      );
    }

    const price = product.price;

    const finalPrice =
      product.discountPrice != null && product.discountPrice < product.price
        ? product.discountPrice
        : product.price;

    subtotal += price * item.quantity;
    discount += (price - finalPrice) * item.quantity;
    eligibleAmount += finalPrice * item.quantity;

    orderItems.push({
      product: product._id,
      name: product.name,
      image: product.images?.[0] || "",
      price: finalPrice,

      // Snapshot purchase cost so later product edits don't change old orders.
      costPriceSnapshot: product.costPrice,

      quantity: item.quantity,
    });
  }

  // Validate coupon
  let coupon = null;
  let couponDiscount = 0;

  if (couponCode) {
    coupon = await Coupon.findOne({
      code: couponCode,
    });

    if (!coupon) {
      return next(new ExpressError(400, "Invalid coupon code"));
    }

    if (!coupon.isActive) {
      return next(new ExpressError(400, "This coupon is inactive"));
    }

    if (new Date(coupon.expiryDate) <= new Date()) {
      return next(new ExpressError(400, "This coupon has expired"));
    }

    if (coupon.usedCount >= coupon.usageLimit) {
      return next(new ExpressError(400, "Coupon usage limit reached"));
    }

    if (eligibleAmount < coupon.minOrderAmount) {
      return next(
        new ExpressError(
          400,
          `Minimum order amount is ₹${coupon.minOrderAmount}`,
        ),
      );
    }

    if (coupon.discountType === "percentage") {
      couponDiscount = (eligibleAmount * coupon.discountValue) / 100;

      if (coupon.maxDiscount !== null && coupon.maxDiscount !== undefined) {
        couponDiscount = Math.min(couponDiscount, coupon.maxDiscount);
      }
    } else {
      couponDiscount = coupon.discountValue;
    }

    // Coupon discount cannot exceed the payable product amount.
    couponDiscount = Math.min(couponDiscount, eligibleAmount);

    couponDiscount = Math.round(couponDiscount * 100) / 100;
  }

  const shippingCharge = 0;

  const totalAmount = Math.max(
    0,
    Math.round((eligibleAmount - couponDiscount + shippingCharge) * 100) / 100,
  );

  // Create order
  const order = await Order.create({
    user: req.user._id,
    items: orderItems,
    shippingAddress,
    paymentMethod,
    subtotal,
    discount,
    couponCode: coupon ? coupon.code : "",
    couponDiscount,
    shippingCharge,
    totalAmount,
  });

  const reservedItems = [];

  // Reserve stock using conditional updates.
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
      // Restore stock reserved earlier in this request.
      for (const reservedItem of reservedItems) {
        await Product.findByIdAndUpdate(reservedItem.product, {
          $inc: {
            stock: reservedItem.quantity,
          },
        });
      }

      await Order.findByIdAndDelete(order._id);

      return next(
        new ExpressError(
          409,
          "Product stock changed during checkout. Please try again.",
        ),
      );
    }

    reservedItems.push({
      product: item.product._id,
      quantity: item.quantity,
    });
  }

  // Atomically claim one coupon use.
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
      // Restore reserved stock if coupon is no longer available.
      for (const reservedItem of reservedItems) {
        await Product.findByIdAndUpdate(reservedItem.product, {
          $inc: {
            stock: reservedItem.quantity,
          },
        });
      }

      await Order.findByIdAndDelete(order._id);

      return next(
        new ExpressError(
          409,
          "This coupon is no longer available. Please apply another coupon.",
        ),
      );
    }
  }

  try {
    cart.items = [];
    await cart.save();
  } catch (error) {
    // Compensate if cart clearing fails.
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

    await Order.findByIdAndDelete(order._id);
    throw error;
  }

  res.status(201).json({
    message: "order created successfully",
    success: true,
    order,
  });
});

// Get logged-in user's orders
const getMyOrders = wrapAsync(async (req, res) => {
  const orders = await Order.find({
    user: req.user._id,
  }).populate("items.product");

  res.status(200).json({
    message: "orders fetched successfully",
    success: true,
    orders,
  });
});

// Get a single order belonging to the logged-in user
const getOrderById = wrapAsync(async (req, res, next) => {
  const { id } = req.params;

  const order = await Order.findOne({
    _id: id,
    user: req.user._id,
  }).populate("items.product");

  if (!order) {
    return next(new ExpressError(404, "order not found"));
  }

  res.status(200).json({
    message: "order fetched successfully",
    success: true,
    order,
  });
});

// Cancel order and restore stock
const cancelOrder = wrapAsync(async (req, res, next) => {
  const { id } = req.params;

  const order = await Order.findOneAndUpdate(
    {
      _id: id,
      user: req.user._id,
      orderStatus: {
        $in: ["pending", "confirmed", "processing"],
      },
    },
    {
      $set: {
        orderStatus: "cancelled",
        cancelledAt: new Date(),
      },
    },
    { new: true },
  );

  if (!order) {
    const existingOrder = await Order.findOne({
      _id: id,
      user: req.user._id,
    });

    if (!existingOrder) {
      return next(new ExpressError(404, "order not found"));
    }

    return next(
      new ExpressError(400, "order cannot be cancelled at its current stage"),
    );
  }

  for (const item of order.items) {
    const product = await Product.findByIdAndUpdate(
      item.product,
      {
        $inc: {
          stock: item.quantity,
        },
      },
      { new: true },
    );

    if (!product) {
      return next(
        new ExpressError(
          500,
          "Order was cancelled, but stock restoration needs admin review",
        ),
      );
    }
  }

  // Release coupon usage after cancellation.
  if (order.couponCode && order.couponDiscount > 0) {
    await Coupon.findOneAndUpdate(
      {
        code: order.couponCode,
        usedCount: { $gt: 0 },
      },
      {
        $inc: {
          usedCount: -1,
        },
      },
    );
  }

  res.status(200).json({
    message: "order cancelled successfully and stock restored",
    success: true,
    order,
  });
});

// Customer submits a return request
const returnOrder = wrapAsync(async (req, res, next) => {
  const { id } = req.params;

  const returnReason =
    typeof req.body.returnReason === "string"
      ? req.body.returnReason.trim()
      : "";

  if (!returnReason) {
    return next(new ExpressError(400, "return reason is required"));
  }

  const order = await Order.findOneAndUpdate(
    {
      _id: id,
      user: req.user._id,
      orderStatus: "delivered",
    },
    {
      $set: {
        orderStatus: "return_requested",
        returnReason,
        returnRequestedAt: new Date(),
        returnReviewedAt: null,
        returnReceivedAt: null,
        returnStockRestored: false,
      },
    },
    { new: true, runValidators: true },
  );

  if (!order) {
    const existingOrder = await Order.findOne({
      _id: id,
      user: req.user._id,
    });

    if (!existingOrder) {
      return next(new ExpressError(404, "order not found"));
    }

    return next(
      new ExpressError(
        400,
        "only delivered orders can be submitted for return",
      ),
    );
  }

  res.status(200).json({
    message: "return request submitted successfully",
    success: true,
    order,
  });
});

// Admin approves a return request
const approveReturn = wrapAsync(async (req, res, next) => {
  const { id } = req.params;

  const order = await Order.findOneAndUpdate(
    {
      _id: id,
      orderStatus: "return_requested",
    },
    {
      $set: {
        orderStatus: "return_approved",
        returnReviewedAt: new Date(),
      },
    },
    { new: true, runValidators: true },
  );

  if (!order) {
    return next(
      new ExpressError(400, "return request not found or already reviewed"),
    );
  }

  res.status(200).json({
    message: "return request approved",
    success: true,
    order,
  });
});

// Admin rejects a return request
const rejectReturn = wrapAsync(async (req, res, next) => {
  const { id } = req.params;
  const { rejectionReason } = req.body || {};

  if (typeof rejectionReason !== "string" || !rejectionReason.trim()) {
    return next(new ExpressError(400, "Rejection reason is required."));
  }

  const order = await Order.findOneAndUpdate(
    {
      _id: id,
      orderStatus: "return_requested",
    },
    {
      $set: {
        orderStatus: "return_rejected",
        returnReviewedAt: new Date(),
        returnRejectionReason: rejectionReason.trim(),
      },
    },
    { new: true, runValidators: true },
  );

  if (!order) {
    return next(
      new ExpressError(400, "Return request not found or already reviewed."),
    );
  }

  res.status(200).json({
    message: "Return request rejected successfully.",
    success: true,
    order,
  });
});

// Admin confirms physical receipt and inspection.
// Stock is restored only after this step.
const completeReturn = wrapAsync(async (req, res, next) => {
  const { id } = req.params;

  const order = await Order.findOneAndUpdate(
    {
      _id: id,
      orderStatus: "return_approved",
      returnStockRestored: false,
    },
    {
      $set: {
        orderStatus: "returned",
        returnReceivedAt: new Date(),
        returnStockRestored: true,
      },
    },
    { new: true, runValidators: true },
  );

  if (!order) {
    return next(
      new ExpressError(
        400,
        "order is not approved for return, or return has already been completed",
      ),
    );
  }

  for (const item of order.items) {
    const product = await Product.findByIdAndUpdate(
      item.product,
      {
        $inc: {
          stock: item.quantity,
        },
      },
      { new: true },
    );

    if (!product) {
      return next(
        new ExpressError(
          500,
          "Return marked complete, but stock restoration needs admin review",
        ),
      );
    }
  }

  res.status(200).json({
    message: "return completed and stock restored",
    success: true,
    order,
  });
});

// Admin: Get all customer orders
const getAllOrders = wrapAsync(async (req, res) => {
  const orders = await Order.find()
    .populate("user", "username email")
    .populate("items.product")
    .sort({ createdAt: -1 });

  res.status(200).json({
    message: "all orders fetched successfully",
    success: true,
    orders,
  });
});

// Admin: Update order status
const updateOrderStatus = wrapAsync(async (req, res) => {
  const { id } = req.params;
  const { orderStatus, paymentCollected } = req.body;

  const allowedStatuses = ["confirmed", "processing", "shipped", "delivered"];

  if (!allowedStatuses.includes(orderStatus)) {
    throw new ExpressError(400, "Invalid order status.");
  }

  const order = await Order.findById(id);

  if (!order) {
    throw new ExpressError(404, "Order not found.");
  }

  const allowedTransitions = {
    pending: ["confirmed"],
    confirmed: ["processing"],
    processing: ["shipped"],
    shipped: ["delivered"],
  };

  if (!allowedTransitions[order.orderStatus]?.includes(orderStatus)) {
    throw new ExpressError(
      400,
      `Cannot change status from ${order.orderStatus} to ${orderStatus}.`,
    );
  }

  // COD delivery requires payment confirmation.
  if (
    orderStatus === "delivered" &&
    order.paymentMethod?.toLowerCase() === "cod" &&
    typeof paymentCollected !== "boolean"
  ) {
    throw new ExpressError(
      400,
      "Please confirm whether COD payment was collected.",
    );
  }

  if (
    orderStatus === "delivered" &&
    order.paymentMethod?.toLowerCase() === "cod" &&
    paymentCollected
  ) {
    order.paymentStatus = "paid";
  }

  order.orderStatus = orderStatus;

  if (orderStatus === "delivered") {
    order.deliveredAt = new Date();
  }

  await order.save();

  res.status(200).json({
    success: true,
    message: "Order status updated successfully.",
    order,
  });
});

module.exports = {
  createOrder,
  getMyOrders,
  getOrderById,
  cancelOrder,
  returnOrder,
  approveReturn,
  rejectReturn,
  completeReturn,
  getAllOrders,
  updateOrderStatus,
};
