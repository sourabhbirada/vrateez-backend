const Banner = require("../model/Banner");
const asyncHandler = require("../utilits/asyncHandler");
const ApiError = require("../utilits/ApiError");
const { ok } = require("../utilits/response");

const listBanners = asyncHandler(async (_req, res) => {
  const items = await Banner.find({ isActive: true }).sort({ position: 1, createdAt: -1 });
  return ok(res, { items });
});

const listBannersAdmin = asyncHandler(async (_req, res) => {
  const items = await Banner.find().sort({ position: 1, createdAt: -1 });
  return ok(res, { items });
});

const createBanner = asyncHandler(async (req, res) => {
  const created = await Banner.create(req.body);
  return ok(res, { banner: created }, "Banner created", 201);
});

const updateBanner = asyncHandler(async (req, res) => {
  const updated = await Banner.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!updated) throw new ApiError(404, "Banner not found");
  return ok(res, { banner: updated }, "Banner updated");
});

const deleteBanner = asyncHandler(async (req, res) => {
  const deleted = await Banner.findByIdAndDelete(req.params.id);
  if (!deleted) throw new ApiError(404, "Banner not found");
  return ok(res, { banner: deleted }, "Banner deleted");
});

module.exports = {
  listBanners,
  listBannersAdmin,
  createBanner,
  updateBanner,
  deleteBanner,
};
