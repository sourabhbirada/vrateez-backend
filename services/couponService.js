function defaultShippingCharge(subtotal) {
  return subtotal >= 499 ? 0 : 49;
}

const BASE_COUPONS = [
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

const TEST1INR_COUPON = {
  code: "TEST1INR",
  type: "final_total",
  value: 1,
  minOrderAmount: 0,
  description: "Test only: payable total becomes Rs 1 (dev only unless ENABLE_TEST1INR_COUPON=true)",
};

const test1InrEnabled =
  process.env.NODE_ENV !== "production" || process.env.ENABLE_TEST1INR_COUPON === "true";

const AVAILABLE_COUPONS = test1InrEnabled ? [...BASE_COUPONS, TEST1INR_COUPON] : BASE_COUPONS;

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

function calculateDiscountAmount(subtotal, coupon, shippingCharge) {
  const shipping = shippingCharge ?? defaultShippingCharge(subtotal);

  if (coupon.type === "final_total") {
    const target = Number(coupon.value);
    if (!Number.isFinite(target) || target < 0) {
      return 0;
    }
    const gross = subtotal + shipping;
    if (target >= gross) {
      return 0;
    }
    return gross - target;
  }

  if (coupon.type === "flat") {
    return Math.min(coupon.value, subtotal);
  }

  const rawDiscount = Math.floor((subtotal * coupon.value) / 100);
  if (coupon.maxDiscount) {
    return Math.min(rawDiscount, coupon.maxDiscount);
  }
  return rawDiscount;
}

/**
 * @param {number} subtotal
 * @param {string} couponCode
 * @param {number} [shippingCharge] - if omitted, uses same rule as checkout (499+ free else 49)
 */
function validateCouponForSubtotal(subtotal, couponCode, shippingCharge) {
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

  const resolvedShipping =
    shippingCharge !== undefined && shippingCharge !== null && Number.isFinite(Number(shippingCharge))
      ? Number(shippingCharge)
      : defaultShippingCharge(subtotal);

  const discountAmount = calculateDiscountAmount(subtotal, coupon, resolvedShipping);

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
  defaultShippingCharge,
};
