const Order = require("../model/Order");
const Payment = require("../model/Payment");
const asyncHandler = require("../utilits/asyncHandler");
const ApiError = require("../utilits/ApiError");
const { ok } = require("../utilits/response");
const {
  createRazorpayOrder,
  createStripePaymentIntent,
  verifyRazorpaySignature,
  verifyStripePayment,
  getRazorpayKeyId,
  getStripePublishableKey,
  isRazorpayConfigured,
  isStripeConfigured,
  getAvailableProviders,
} = require("../services/paymentService");

// Create payment for authenticated user (supports Stripe and Razorpay)
const createPaymentIntent = asyncHandler(async (req, res) => {
  const { orderId, provider = "stripe" } = req.body;

  const order = await Order.findOne({ _id: orderId, user: req.user._id });
  if (!order) {
    throw new ApiError(404, "Order not found");
  }

  let paymentData;
  if (provider === "razorpay") {
    paymentData = await createRazorpayOrder(order);
  } else {
    paymentData = await createStripePaymentIntent(order);
  }

  const payment = await Payment.create({
    order: order._id,
    user: req.user._id,
    provider: paymentData.provider,
    paymentId: paymentData.paymentId,
    razorpayOrderId: paymentData.razorpayOrderId,
    amount: paymentData.amount,
    currency: paymentData.currency,
    status: "created",
    metadata: {
      paymentMethod: order.paymentMethod,
      clientSecret: paymentData.clientSecret,
    },
  });

  return ok(
    res,
    {
      payment,
      // Stripe fields
      clientSecret: paymentData.clientSecret,
      stripePublishableKey: getStripePublishableKey(),
      // Razorpay fields
      razorpayOrderId: paymentData.razorpayOrderId,
      razorpayKeyId: getRazorpayKeyId(),
      // Common fields
      amount: paymentData.amount * 100, // In paise
      currency: paymentData.currency,
      provider: paymentData.provider,
      providers: getAvailableProviders(),
    },
    "Payment intent created",
    201
  );
});

// Verify payment for authenticated user (supports Stripe and Razorpay)
const verifyPayment = asyncHandler(async (req, res) => {
  const { orderId, provider = "stripe", razorpayOrderId, razorpayPaymentId, razorpaySignature, paymentIntentId } = req.body;

  const order = await Order.findOne({ _id: orderId, user: req.user._id });
  if (!order) {
    throw new ApiError(404, "Order not found");
  }

  const payment = await Payment.findOne({ order: orderId, user: req.user._id });
  if (!payment) {
    throw new ApiError(404, "Payment not found");
  }

  let isValid = false;
  let transactionId = null;

  if (provider === "razorpay") {
    // Verify Razorpay signature
    isValid = verifyRazorpaySignature(razorpayOrderId, razorpayPaymentId, razorpaySignature);
    transactionId = razorpayPaymentId;
  } else {
    // Verify Stripe payment
    const stripeResult = await verifyStripePayment(paymentIntentId || payment.paymentId);
    isValid = stripeResult.verified;
    transactionId = paymentIntentId || payment.paymentId;
  }

  if (!isValid) {
    payment.status = "failed";
    await payment.save();

    order.paymentStatus = "failed";
    await order.save();

    throw new ApiError(400, "Payment verification failed");
  }

  // Update payment
  payment.status = "success";
  payment.transactionId = transactionId;
  await payment.save();

  // Update order
  order.paymentStatus = "paid";
  order.orderStatus = "processing";
  await order.save();

  return ok(res, { order, payment }, "Payment verified successfully");
});

// Confirm COD order for authenticated user
const confirmCodOrder = asyncHandler(async (req, res) => {
  const { orderId } = req.body;

  const order = await Order.findOne({ _id: orderId, user: req.user._id });
  if (!order) {
    throw new ApiError(404, "Order not found");
  }

  if (order.paymentMethod !== "cod") {
    throw new ApiError(400, "This order is not a COD order");
  }

  // Update order status for COD
  order.orderStatus = "processing";
  await order.save();

  return ok(res, { order }, "COD order confirmed");
});

// Legacy mock payment confirmation (kept for backwards compatibility)
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
  verifyPayment,
  confirmPayment,
  confirmCodOrder,
};
