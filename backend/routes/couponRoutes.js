const express = require("express");
const router = express.Router();

const {
  createCoupon,
  getAllCoupons,
  getCouponById,
  updateCoupon,
  deleteCoupon,
} = require("../controllers/couponController");

const { isAuthentication, isAdmin } = require("../middleware/authMiddleware");

const Cart = require("../model/Cart");
const Coupon = require("../model/Coupon");
const ExpressError = require("../utils/ExpressError");
const wrapAsync = require("../utils/wrapAsync");

// Customer: Apply coupon
router.post(
  "/apply",
  isAuthentication,
  wrapAsync(async (req, res, next) => {
    const { code } = req.body;

    if (typeof code !== "string" || !code.trim() || code.trim().length > 50) {
      return next(new ExpressError(400, "Please enter a valid coupon code"));
    }

    const couponCode = code.trim().toUpperCase();

    const coupon = await Coupon.findOne({
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

    const cart = await Cart.findOne({
      user: req.user._id,
    }).populate("items.product");

    if (!cart || cart.items.length === 0) {
      return next(new ExpressError(400, "Your cart is empty"));
    }

    let eligibleAmount = 0;

    for (const item of cart.items) {
      const product = item.product;

      if (!product || !product.isActive) {
        return next(
          new ExpressError(400, "A product in your cart is unavailable"),
        );
      }

      const finalPrice =
        product.discountPrice && product.discountPrice < product.price
          ? product.discountPrice
          : product.price;

      eligibleAmount += finalPrice * item.quantity;
    }

    if (eligibleAmount < coupon.minOrderAmount) {
      return next(
        new ExpressError(
          400,
          `Minimum order amount is ₹${coupon.minOrderAmount}`,
        ),
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

    res.status(200).json({
      success: true,
      message: "Coupon applied successfully",
      couponCode: coupon.code,
      discountType: coupon.discountType,
      couponDiscount,
      eligibleAmount,
      totalAmount: Math.max(
        0,
        Math.round((eligibleAmount - couponDiscount) * 100) / 100,
      ),
    });
  }),
);

// Admin-only coupon management
router.use(isAuthentication);
router.use(isAdmin);

router.get("/", getAllCoupons);
router.post("/", createCoupon);
router.get("/:id", getCouponById);
router.patch("/:id", updateCoupon);
router.delete("/:id", deleteCoupon);

module.exports = router;
