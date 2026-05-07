const Coupon = require("../model/Coupon");
const asyncHandler = require("../utilits/asyncHandler");
const ApiError = require("../utilits/ApiError");
const { ok } = require("../utilits/response");

const listCoupons = asyncHandler(async (_req, res) => {
  const items = await Coupon.find().sort({ createdAt: -1 });
  return ok(res, { items });
});

const createCoupon = asyncHandler(async (req, res) => {
  const payload = { ...req.body, code: String(req.body.code || "").toUpperCase() };
  const created = await Coupon.create(payload);
  return ok(res, { coupon: created }, "Coupon created", 201);
});

const updateCoupon = asyncHandler(async (req, res) => {
  const payload = { ...req.body };
  if (payload.code) payload.code = String(payload.code).toUpperCase();
  const updated = await Coupon.findByIdAndUpdate(req.params.id, payload, { new: true, runValidators: true });
  if (!updated) throw new ApiError(404, "Coupon not found");
  return ok(res, { coupon: updated }, "Coupon updated");
});

const deleteCoupon = asyncHandler(async (req, res) => {
  const deleted = await Coupon.findByIdAndDelete(req.params.id);
  if (!deleted) throw new ApiError(404, "Coupon not found");
  return ok(res, { coupon: deleted }, "Coupon deleted");
});

module.exports = {
  listCoupons,
  createCoupon,
  updateCoupon,
  deleteCoupon,
};
