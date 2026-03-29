const asyncHandler = require("../utilits/asyncHandler");
const ApiError = require("../utilits/ApiError");
const { ok } = require("../utilits/response");
const { validateCouponForSubtotal } = require("../services/couponService");

const validateCoupon = asyncHandler(async (req, res) => {
  const { couponCode, subtotal } = req.body;

  const parsedSubtotal = Number(subtotal);
  if (!Number.isFinite(parsedSubtotal) || parsedSubtotal < 0) {
    throw new ApiError(400, "Valid subtotal is required");
  }

  const result = validateCouponForSubtotal(parsedSubtotal, couponCode);
  if (!result.valid) {
    throw new ApiError(400, result.message);
  }

  return ok(res, {
    couponCode: result.code,
    discountAmount: result.discountAmount,
    description: result.coupon.description,
  });
});

module.exports = {
  validateCoupon,
};
