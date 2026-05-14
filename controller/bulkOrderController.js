const BulkOrder = require("../model/BulkOrder");
const asyncHandler = require("../utilits/asyncHandler");
const ApiError = require("../utilits/ApiError");
const { ok } = require("../utilits/response");

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const createBulkOrder = asyncHandler(async (req, res) => {
  const {
    companyName = "",
    yourName,
    phone,
    email,
    location = "",
    inquiryType,
    message = "",
  } = req.body;

  if (!EMAIL_REGEX.test(String(email).trim())) {
    throw new ApiError(400, "Invalid email address");
  }

  const inquiry = await BulkOrder.create({
    companyName,
    yourName,
    phone,
    email,
    location,
    inquiryType,
    message,
  });

  return ok(res, { inquiry }, "Bulk inquiry submitted", 201);
});

const listBulkOrdersAdmin = asyncHandler(async (_req, res) => {
  const items = await BulkOrder.find().sort({ createdAt: -1 });
  return ok(res, { items });
});

const updateBulkOrderStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const updated = await BulkOrder.findByIdAndUpdate(
    req.params.id,
    { status },
    { new: true, runValidators: true },
  );
  if (!updated) {
    throw new ApiError(404, "Bulk inquiry not found");
  }
  return ok(res, { inquiry: updated }, "Bulk inquiry updated");
});

module.exports = {
  createBulkOrder,
  listBulkOrdersAdmin,
  updateBulkOrderStatus,
};
