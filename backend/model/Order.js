const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    image: {
      type: String,
      default: "",
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    costPriceSnapshot: {
      type: Number,
      required: true,
      min: 0,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
      validate: {
        validator: Number.isInteger,
        message: "Quantity must be an integer",
      },
    },
  },
  { _id: false },
);

const shippingAddressSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true },
    mobile: { type: String, required: true, trim: true },
    pincode: { type: String, required: true, trim: true },
    houseNo: { type: String, required: true, trim: true },
    street: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    state: { type: String, required: true, trim: true },
    country: { type: String, default: "India", trim: true },
  },
  { _id: false },
);

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    items: {
      type: [orderItemSchema],
      required: true,
      validate: {
        validator: (items) => items.length > 0,
        message: "Order must contain at least one product",
      },
    },

    shippingAddress: {
      type: shippingAddressSchema,
      required: true,
    },

    paymentMethod: {
      type: String,
      enum: ["COD", "Razorpay"],
      required: true,
    },

    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed", "refunded"],
      default: "pending",
    },

    orderStatus: {
      type: String,
      enum: [
        "pending",
        "confirmed",
        "processing",
        "shipped",
        "delivered",
        "cancelled",
        "return_requested",
        "return_approved",
        "return_rejected",
        "returned",
      ],
      default: "pending",
    },

    subtotal: { type: Number, required: true, min: 0 },
    discount: { type: Number, default: 0, min: 0 },

    couponCode: {
      type: String,
      default: "",
      trim: true,
      uppercase: true,
    },

    couponDiscount: { type: Number, default: 0, min: 0 },

    razorpayOrderId: {
      type: String,
      default: undefined,
    },

    // Empty or missing payment IDs are not stored as unique values.
    razorpayPaymentId: {
      type: String,
      default: undefined,
      trim: true,
    },

    shippingCharge: { type: Number, default: 0, min: 0 },
    totalAmount: { type: Number, required: true, min: 0 },

    deliveredAt: { type: Date, default: null },
    cancelledAt: { type: Date, default: null },

    returnReason: { type: String, default: "", trim: true },
    returnRejectionReason: { type: String, default: "", trim: true },
    returnRequestedAt: { type: Date, default: null },
    returnReviewedAt: { type: Date, default: null },
    returnReceivedAt: { type: Date, default: null },
    returnStockRestored: { type: Boolean, default: false },
  },
  { timestamps: true },
);

// Only non-empty Razorpay payment IDs must be unique.
orderSchema.index(
  { razorpayPaymentId: 1 },
  {
    unique: true,
    partialFilterExpression: {
      razorpayPaymentId: { $gt: "" },
    },
  },
);

module.exports = mongoose.model("Order", orderSchema);
