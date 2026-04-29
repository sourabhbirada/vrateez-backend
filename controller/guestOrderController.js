const mongoose = require("mongoose");
const Order = require("../model/Order");
const Payment = require("../model/Payment");
const Product = require("../model/Product");
const asyncHandler = require("../utilits/asyncHandler");
const ApiError = require("../utilits/ApiError");
const { ok } = require("../utilits/response");
const {
  createRazorpayOrder,
  verifyRazorpaySignature,
  getRazorpayKeyId,
  isRazorpayConfigured,
  getAvailableProviders,
} = require("../services/paymentService");
const { validateCouponForSubtotal } = require("../services/couponService");

// Helper to validate MongoDB ObjectId
const isValidObjectId = (id) => {
  return mongoose.Types.ObjectId.isValid(id) && String(new mongoose.Types.ObjectId(id)) === id;
};

// Create guest order
const createGuestOrder = asyncHandler(async (req, res) => {
  const { items, shippingAddress, paymentMethod, guestInfo, notes, couponCode } = req.body;

  if (!items || items.length === 0) {
    throw new ApiError(400, "Cart is empty");
  }

  if (!guestInfo || !guestInfo.name || !guestInfo.email || !guestInfo.phone) {
    throw new ApiError(400, "Guest info (name, email, phone) is required");
  }

  const orderItems = [];
  let subtotal = 0;

  for (const item of items) {
    // Validate product ID format
    if (!item.productId || !isValidObjectId(item.productId)) {
      throw new ApiError(400, `Invalid product ID format: ${item.productId}. Please refresh your cart.`);
    }

    const product = await Product.findById(item.productId);

    if (!product || !product.isActive) {
      throw new ApiError(400, `Product unavailable: ${item.productId}`);
    }

    orderItems.push({
      product: product._id,
      name: product.name,
      image: product.image,
      price: product.price,
      quantity: item.quantity,
    });

    subtotal += product.price * item.quantity;
  }

  const shippingCharge = subtotal >= 499 ? 0 : 49;
  let discountAmount = 0;
  let appliedCouponCode;

  if (couponCode) {
    const couponResult = validateCouponForSubtotal(subtotal, couponCode);
    if (!couponResult.valid) {
      throw new ApiError(400, couponResult.message);
    }
    discountAmount = couponResult.discountAmount;
    appliedCouponCode = couponResult.code;
  }

  const totalAmount = Math.max(subtotal - discountAmount + shippingCharge, 0);

  const order = await Order.create({
    guestInfo,
    items: orderItems,
    shippingAddress,
    paymentMethod,
    notes,
    couponCode: appliedCouponCode,
    subtotal,
    shippingCharge,
    discountAmount,
    totalAmount,
  });

  return ok(res, { order }, "Guest order created", 201);
});

// Create payment for guest order (supports Razorpay)
const createGuestPayment = asyncHandler(async (req, res) => {
  const { orderId, email, provider = "razorpay" } = req.body;

  const order = await Order.findById(orderId);

  if (!order) {
    throw new ApiError(404, "Order not found");
  }

  // Verify email matches guest order
  if (order.guestInfo && order.guestInfo.email !== email) {
    throw new ApiError(403, "Email does not match order");
  }

  if (provider !== "razorpay") {
    throw new ApiError(400, "Unsupported payment provider");
  }

  if (!isRazorpayConfigured()) {
    throw new ApiError(503, "Razorpay is not configured. Please use Cash on Delivery.");
  }

  const paymentData = await createRazorpayOrder(order);

  const payment = await Payment.create({
    order: order._id,
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
      // Razorpay fields
      razorpayOrderId: paymentData.razorpayOrderId,
      razorpayKeyId: getRazorpayKeyId(),
      // Common fields
      amount: paymentData.amount * 100, // In paise
      currency: paymentData.currency,
      provider: paymentData.provider,
      providers: getAvailableProviders(),
    },
    "Payment created",
    201
  );
});

// Verify guest payment (supports Razorpay)
const verifyGuestPayment = asyncHandler(async (req, res) => {
  const { orderId, email, provider = "razorpay", razorpayOrderId, razorpayPaymentId, razorpaySignature, paymentIntentId } = req.body;

  const order = await Order.findById(orderId);

  if (!order) {
    throw new ApiError(404, "Order not found");
  }

  // Verify email matches guest order
  if (order.guestInfo && order.guestInfo.email !== email) {
    throw new ApiError(403, "Email does not match order");
  }

  const payment = await Payment.findOne({ order: orderId });

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
    throw new ApiError(400, "Unsupported payment provider");
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

// Get guest order by ID (with email verification)
const getGuestOrder = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { email } = req.query;

  const order = await Order.findById(id);

  if (!order) {
    throw new ApiError(404, "Order not found");
  }

  // Verify email matches guest order
  if (order.guestInfo && order.guestInfo.email !== email) {
    throw new ApiError(403, "Email does not match order");
  }

  return ok(res, { order });
});

// Confirm COD order for guest
const confirmGuestCodOrder = asyncHandler(async (req, res) => {
  const { orderId, email } = req.body;

  const order = await Order.findById(orderId);

  if (!order) {
    throw new ApiError(404, "Order not found");
  }

  // Verify email matches guest order
  if (order.guestInfo && order.guestInfo.email !== email) {
    throw new ApiError(403, "Email does not match order");
  }

  if (order.paymentMethod !== "cod") {
    throw new ApiError(400, "This order is not a COD order");
  }

  // Update order status for COD
  order.orderStatus = "processing";
  await order.save();

  return ok(res, { order }, "COD order confirmed");
});

module.exports = {
  createGuestOrder,
  createGuestPayment,
  verifyGuestPayment,
  getGuestOrder,
  confirmGuestCodOrder,
};
