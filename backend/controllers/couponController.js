const mongoose = require("mongoose");
const Coupon = require("../model/Coupon");
const wrapAsync = require("../utils/wrapAsync");
const ExpressError = require("../utils/ExpressError");

// Helper: Calculate coupon status
const getCouponStatus = (coupon) => {
  if (new Date(coupon.expiryDate) <= new Date()) {
    return "expired";
  }

  if (!coupon.isActive) {
    return "inactive";
  }

  if (coupon.usedCount >= coupon.usageLimit) {
    return "inactive";
  }

  return "active";
};

// CREATE COUPON
module.exports.createCoupon = wrapAsync(async (req, res, next) => {
  const {
    code,
    discountType,
    discountValue,
    minOrderAmount,
    maxDiscount,
    expiryDate,
    usageLimit,
    isActive,
  } = req.body;

  if (!code || !discountType || discountValue === undefined || !expiryDate) {
    return next(
      new ExpressError(
        400,
        "Code, discount type, discount value and expiry date are required",
      ),
    );
  }

  const normalizedCode = String(code).trim().toUpperCase();

  const existingCoupon = await Coupon.findOne({
    code: normalizedCode,
  });

  if (existingCoupon) {
    return next(new ExpressError(409, "Coupon code already exists"));
  }

  const parsedExpiryDate = new Date(expiryDate);

  if (Number.isNaN(parsedExpiryDate.getTime())) {
    return next(new ExpressError(400, "Invalid expiry date"));
  }

  if (parsedExpiryDate <= new Date()) {
    return next(new ExpressError(400, "Expiry date must be in the future"));
  }

  if (!["percentage", "fixed"].includes(discountType)) {
    return next(new ExpressError(400, "Invalid discount type"));
  }

  if (discountType === "percentage" && Number(discountValue) > 100) {
    return next(new ExpressError(400, "Percentage discount cannot exceed 100"));
  }

  if (discountType === "fixed" && maxDiscount != null && maxDiscount !== "") {
    return next(
      new ExpressError(
        400,
        "Maximum discount is only applicable to percentage coupons",
      ),
    );
  }

  const coupon = await Coupon.create({
    code: normalizedCode,
    discountType,
    discountValue: Number(discountValue),
    minOrderAmount: minOrderAmount === undefined ? 0 : Number(minOrderAmount),
    maxDiscount:
      maxDiscount === "" || maxDiscount == null ? null : Number(maxDiscount),
    expiryDate: parsedExpiryDate,
    usageLimit: usageLimit === undefined ? 100 : Number(usageLimit),
    isActive: isActive === undefined ? true : isActive,
  });

  res.status(201).json({
    success: true,
    message: "Coupon created successfully",
    coupon,
  });
});

// GET ALL COUPONS: Search, filter and pagination
module.exports.getAllCoupons = wrapAsync(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 10));
  const skip = (page - 1) * limit;

  const search = String(req.query.search || "").trim();
  const status = String(req.query.status || "all").toLowerCase();

  const filter = {};

  if (search) {
    const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    filter.code = {
      $regex: escapedSearch,
      $options: "i",
    };
  }

  const now = new Date();

  if (status === "active") {
    filter.isActive = true;
    filter.expiryDate = { $gt: now };
    filter.$expr = {
      $lt: ["$usedCount", "$usageLimit"],
    };
  } else if (status === "inactive") {
    filter.isActive = false;
    filter.expiryDate = { $gt: now };
  } else if (status === "expired") {
    filter.$or = [
      { expiryDate: { $lte: now } },
      {
        $expr: {
          $gte: ["$usedCount", "$usageLimit"],
        },
      },
    ];
  } else if (status !== "all") {
    return res.status(400).json({
      success: false,
      message: "Invalid status. Use all, active, inactive or expired",
    });
  }

  const [coupons, totalCoupons] = await Promise.all([
    Coupon.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),

    Coupon.countDocuments(filter),
  ]);

  const formattedCoupons = coupons.map((coupon) => ({
    ...coupon.toObject(),
    status: getCouponStatus(coupon),
  }));

  res.status(200).json({
    success: true,
    coupons: formattedCoupons,
    pagination: {
      currentPage: page,
      totalPages: Math.ceil(totalCoupons / limit),
      totalCoupons,
      limit,
      hasNextPage: page * limit < totalCoupons,
      hasPrevPage: page > 1,
    },
  });
});

// GET SINGLE COUPON
module.exports.getCouponById = wrapAsync(async (req, res, next) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return next(new ExpressError(400, "Invalid coupon ID"));
  }

  const coupon = await Coupon.findById(id);

  if (!coupon) {
    return next(new ExpressError(404, "Coupon not found"));
  }

  res.status(200).json({
    success: true,
    coupon: {
      ...coupon.toObject(),
      status: getCouponStatus(coupon),
    },
  });
});

// UPDATE COUPON
module.exports.updateCoupon = wrapAsync(async (req, res, next) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return next(new ExpressError(400, "Invalid coupon ID"));
  }

  const coupon = await Coupon.findById(id);

  if (!coupon) {
    return next(new ExpressError(404, "Coupon not found"));
  }

  const allowedFields = [
    "code",
    "discountType",
    "discountValue",
    "minOrderAmount",
    "maxDiscount",
    "expiryDate",
    "usageLimit",
    "isActive",
  ];

  for (const field of allowedFields) {
    if (Object.prototype.hasOwnProperty.call(req.body, field)) {
      coupon[field] = req.body[field];
    }
  }

  if (coupon.code !== undefined) {
    coupon.code = String(coupon.code).trim().toUpperCase();
  }

  if (coupon.discountType === "fixed") {
    coupon.maxDiscount = null;
  }

  if (
    coupon.discountType === "percentage" &&
    Number(coupon.discountValue) > 100
  ) {
    return next(new ExpressError(400, "Percentage discount cannot exceed 100"));
  }

  if (coupon.expiryDate && new Date(coupon.expiryDate) <= new Date()) {
    return next(new ExpressError(400, "Expiry date must be in the future"));
  }

  await coupon.save();

  res.status(200).json({
    success: true,
    message: "Coupon updated successfully",
    coupon: {
      ...coupon.toObject(),
      status: getCouponStatus(coupon),
    },
  });
});

// DELETE COUPON
module.exports.deleteCoupon = wrapAsync(async (req, res, next) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return next(new ExpressError(400, "Invalid coupon ID"));
  }

  const coupon = await Coupon.findByIdAndDelete(id);

  if (!coupon) {
    return next(new ExpressError(404, "Coupon not found"));
  }

  res.status(200).json({
    success: true,
    message: "Coupon deleted successfully",
  });
});
