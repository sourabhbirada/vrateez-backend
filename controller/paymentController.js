const Order = require("../model/Order");
const Payment = require("../model/Payment");
const asyncHandler = require("../utilits/asyncHandler");
const ApiError = require("../utilits/ApiError");
const { ok } = require("../utilits/response");
const { buildMockPayment } = require("../services/paymentService");

const createPaymentIntent = asyncHandler(async (req, res) => {
  const { orderId } = req.body;

  const order = await Order.findOne({ _id: orderId, user: req.user._id });
  if (!order) {
    throw new ApiError(404, "Order not found");
  }

  const paymentData = buildMockPayment(order);

  const payment = await Payment.create({
    order: order._id,
    user: req.user._id,
    provider: "mock",
    paymentId: paymentData.paymentId,
    transactionId: paymentData.transactionId,
    amount: paymentData.amount,
    currency: paymentData.currency,
    status: "created",
    metadata: { paymentMethod: order.paymentMethod },
  });

  return ok(res, { payment }, "Payment intent created", 201);
});

const confirmPayment = asyncHandler(async (req, res) => {
  const { paymentId, success = true } = req.body;

  const payment = await Payment.findOne({ paymentId, user: req.user._id }).populate("order");

  if (!payment) {
    throw new ApiError(404, "Payment not found");
  }

  payment.status = success ? "success" : "failed";
  await payment.save();

  const order = await Order.findById(payment.order._id);
  order.paymentStatus = success ? "paid" : "failed";
  order.orderStatus = success ? "processing" : "placed";
  await order.save();

  return ok(res, { payment, order }, success ? "Payment successful" : "Payment failed");
});

module.exports = {
  createPaymentIntent,
  confirmPayment,
};
