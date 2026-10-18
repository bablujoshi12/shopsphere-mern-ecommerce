const mongoose = require("mongoose");

const couponSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: [true, "Coupon code is required"],
      unique: true,
      uppercase: true,
      trim: true,
      minlength: [3, "Coupon code must be at least 3 characters"],
      maxlength: [30, "Coupon code cannot exceed 30 characters"],
      match: [
        /^[A-Z0-9_-]+$/,
        "Coupon code can contain only letters, numbers, hyphens and underscores",
      ],
    },

    discountType: {
      type: String,
      enum: {
        values: ["percentage", "fixed"],
        message: "Discount type must be percentage or fixed",
      },
      required: [true, "Discount type is required"],
    },

    discountValue: {
      type: Number,
      required: [true, "Discount value is required"],
      min: [1, "Discount value must be at least 1"],
      validate: {
        validator: function (value) {
          return this.discountType !== "percentage" || value <= 100;
        },
        message: "Percentage discount cannot exceed 100",
      },
    },

    minOrderAmount: {
      type: Number,
      default: 0,
      min: [0, "Minimum order amount cannot be negative"],
    },

    maxDiscount: {
      type: Number,
      default: null,
      min: [0, "Maximum discount cannot be negative"],
      validate: {
        validator: function (value) {
          return value == null || this.discountType === "percentage";
        },
        message: "Maximum discount applies only to percentage coupons",
      },
    },

    expiryDate: {
      type: Date,
      required: [true, "Coupon expiry date is required"],
      validate: {
        validator: function (value) {
          return value instanceof Date && !Number.isNaN(value.getTime());
        },
        message: "Please provide a valid expiry date",
      },
    },

    usageLimit: {
      type: Number,
      default: 100,
      min: [1, "Usage limit must be at least 1"],
      validate: {
        validator: Number.isInteger,
        message: "Usage limit must be an integer",
      },
    },

    usedCount: {
      type: Number,
      default: 0,
      min: [0, "Used count cannot be negative"],
      validate: {
        validator: Number.isInteger,
        message: "Used count must be an integer",
      },
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true },
);

// Prevent usage count from exceeding the usage limit.
couponSchema.pre("validate", function () {
  if (this.usedCount > this.usageLimit) {
    this.invalidate("usedCount", "Used count cannot exceed the usage limit");
  }
});

module.exports = mongoose.model("Coupon", couponSchema);
