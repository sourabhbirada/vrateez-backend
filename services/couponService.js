const AVAILABLE_COUPONS = [
  {
    code: "WELCOME10",
    type: "percentage",
    value: 10,
    minOrderAmount: 299,
    maxDiscount: 150,
    description: "10% off up to Rs 150",
  },
  {
    code: "FIT15",
    type: "percentage",
    value: 15,
    minOrderAmount: 499,
    maxDiscount: 250,
    description: "15% off up to Rs 250",
  },
  {
    code: "SAVE100",
    type: "flat",
    value: 100,
    minOrderAmount: 799,
    description: "Flat Rs 100 off",
  },
];

function normalizeCouponCode(code) {
  return String(code || "")
    .trim()
    .toUpperCase();
}

function getCouponByCode(code) {
  const normalizedCode = normalizeCouponCode(code);
  if (!normalizedCode) return null;
  return AVAILABLE_COUPONS.find((coupon) => coupon.code === normalizedCode) || null;
}

function calculateDiscountAmount(subtotal, coupon) {
  if (coupon.type === "flat") {
    return Math.min(coupon.value, subtotal);
  }

  const rawDiscount = Math.floor((subtotal * coupon.value) / 100);
  if (coupon.maxDiscount) {
    return Math.min(rawDiscount, coupon.maxDiscount);
  }
  return rawDiscount;
}

function validateCouponForSubtotal(subtotal, couponCode) {
  const normalizedCode = normalizeCouponCode(couponCode);

  if (!normalizedCode) {
    return {
      valid: false,
      message: "Coupon code is required",
    };
  }

  const coupon = getCouponByCode(normalizedCode);
  if (!coupon) {
    return {
      valid: false,
      message: "Invalid coupon code",
    };
  }

  if (subtotal < coupon.minOrderAmount) {
    return {
      valid: false,
      message: `Minimum order of Rs ${coupon.minOrderAmount} required for ${coupon.code}`,
      coupon,
    };
  }

  const discountAmount = calculateDiscountAmount(subtotal, coupon);

  return {
    valid: true,
    coupon,
    code: coupon.code,
    discountAmount,
  };
}

module.exports = {
  normalizeCouponCode,
  getCouponByCode,
  validateCouponForSubtotal,
};
