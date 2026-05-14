const Faq = require("../model/Faq");
const asyncHandler = require("../utilits/asyncHandler");
const ApiError = require("../utilits/ApiError");
const { ok } = require("../utilits/response");

const listFaqs = asyncHandler(async (_req, res) => {
  const items = await Faq.find({ isActive: true }).sort({ sortOrder: 1, createdAt: -1 });
  return ok(res, { items });
});

const listFaqsAdmin = asyncHandler(async (_req, res) => {
  const items = await Faq.find().sort({ sortOrder: 1, createdAt: -1 });
  return ok(res, { items });
});

const createFaq = asyncHandler(async (req, res) => {
  const created = await Faq.create(req.body);
  return ok(res, { faq: created }, "FAQ created", 201);
});

const updateFaq = asyncHandler(async (req, res) => {
  const updated = await Faq.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!updated) throw new ApiError(404, "FAQ not found");
  return ok(res, { faq: updated }, "FAQ updated");
});

const deleteFaq = asyncHandler(async (req, res) => {
  const deleted = await Faq.findByIdAndDelete(req.params.id);
  if (!deleted) throw new ApiError(404, "FAQ not found");
  return ok(res, { faq: deleted }, "FAQ deleted");
});

module.exports = {
  listFaqs,
  listFaqsAdmin,
  createFaq,
  updateFaq,
  deleteFaq,
};
