const Coupon = require("../model/Coupon");

async function calculateCoupon(code, eligibleAmount) {
  if (!code || typeof code !== "string" || !code.trim()) {
    throw new Error("Please enter a coupon code");
  }

  const normalizedCode = code.trim().toUpperCase();

  const coupon = await Coupon.findOne({
    code: normalizedCode,
  });

  if (!coupon) {
    throw new Error("Invalid coupon code");
  }

  if (!coupon.isActive) {
    throw new Error("This coupon is inactive");
  }

  if (coupon.expiryDate <= new Date()) {
    throw new Error("This coupon has expired");
  }

  if (coupon.usedCount >= coupon.usageLimit) {
    throw new Error("Coupon usage limit reached");
  }

  if (eligibleAmount < coupon.minOrderAmount) {
    throw new Error(`Minimum order amount is ₹${coupon.minOrderAmount}`);
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

  // Never allow discount to exceed eligible amount.
  couponDiscount = Math.min(couponDiscount, eligibleAmount);

  couponDiscount = Math.round(couponDiscount * 100) / 100;

  return {
    couponId: coupon._id,
    couponCode: coupon.code,
    couponDiscount,
  };
}

module.exports = calculateCoupon;
