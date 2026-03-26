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

module.exports = {
  createBulkOrder,
};
