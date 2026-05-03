const crypto = require("crypto");

function getEnvValue(name) {
  const raw = process.env[name];
  if (typeof raw !== "string") {
    return null;
  }

  // Handles accidental spaces/quotes/invisible characters while copying keys.
  const normalized = raw
    .replace(/^\uFEFF/, "")
    .trim()
    .replace(/^['"]|['"]$/g, "")
    .replace(/\s+/g, "");
  return normalized || null;
}

function getRazorpayAuthHint() {
  const keyId = getEnvValue("RAZORPAY_KEY_ID") || "";
  if (keyId.startsWith("rzp_live_")) {
    return "Using LIVE key. Ensure LIVE key secret from Razorpay Dashboard is paired with this key ID.";
  }
  if (keyId.startsWith("rzp_test_")) {
    return "Using TEST key. Ensure TEST key secret from Razorpay Dashboard is paired with this key ID.";
  }
  return "Key ID format looks unusual. It should start with rzp_live_ or rzp_test_.";
}

function getReadableRazorpayError(error) {
  if (!error) {
    return "Unable to create Razorpay order";
  }

  // Razorpay SDK often nests API errors under `error.error.description`.
  const message =
    error?.error?.description ||
    error?.error?.message ||
    error?.description ||
    error?.message ||
    "Unable to create Razorpay order";

  return String(message);
}

// Check if Stripe is configured
const isStripeConfigured = () => {
  return !!getEnvValue("STRIPE_SECRET_KEY");
};

// Check if Razorpay is configured
const isRazorpayConfigured = () => {
  return !!(getEnvValue("RAZORPAY_KEY_ID") && getEnvValue("RAZORPAY_KEY_SECRET"));
};

// Get Stripe instance (lazy initialization)
let stripeInstance = null;
const getStripe = () => {
  if (!stripeInstance && isStripeConfigured()) {
    const Stripe = require("stripe");
    stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY);
  }
  return stripeInstance;
};

// Get Razorpay instance (lazy initialization)
let razorpayInstance = null;
const getRazorpay = () => {
  if (!razorpayInstance && isRazorpayConfigured()) {
    const Razorpay = require("razorpay");
    razorpayInstance = new Razorpay({
      key_id: getEnvValue("RAZORPAY_KEY_ID"),
      key_secret: getEnvValue("RAZORPAY_KEY_SECRET"),
    });
  }
  return razorpayInstance;
};

function isRazorpayAuthError(error) {
  const statusCode = error?.statusCode || error?.error?.statusCode || error?.response?.status;
  const message = String(
    error?.error?.description ||
      error?.error?.message ||
      error?.description ||
      error?.message ||
      ""
  ).toLowerCase();

  return statusCode === 401 || statusCode === 403 || message.includes("authentication") || message.includes("unauthoriz");
}

// Build mock payment data
function buildMockPayment(order) {
  return {
    paymentId: `pay_mock_${Date.now()}`,
    razorpayOrderId: `order_mock_${Date.now()}`,
    clientSecret: `mock_secret_${Date.now()}`,
    transactionId: `txn_${Math.random().toString(36).slice(2, 10)}`,
    amount: order.totalAmount,
    currency: "INR",
    status: "created",
    provider: "mock",
  };
}

// Create Stripe Payment Intent
async function createStripePaymentIntent(order) {
  const stripe = getStripe();

  if (!stripe) {
    // Fallback to mock if Stripe not configured
    return buildMockPayment(order);
  }

  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(order.totalAmount * 100), // Stripe expects amount in paise
    currency: "inr",
    metadata: {
      orderId: order._id.toString(),
    },
  });

  return {
    paymentId: paymentIntent.id,
    clientSecret: paymentIntent.client_secret,
    amount: order.totalAmount,
    currency: "INR",
    status: "created",
    provider: "stripe",
  };
}

// Verify Stripe Payment
async function verifyStripePayment(paymentIntentId) {
  const stripe = getStripe();

  if (!stripe) {
    // Mock verification always succeeds
    return { verified: true, status: "succeeded" };
  }

  const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

  return {
    verified: paymentIntent.status === "succeeded",
    status: paymentIntent.status,
  };
}

// Create Razorpay order
async function createRazorpayOrder(order) {
  const razorpay = getRazorpay();

  if (!razorpay) {
    const error = new Error("Razorpay is not configured");
    error.statusCode = 503;
    throw error;
  }

  const options = {
    amount: Math.round(order.totalAmount * 100), // Razorpay expects amount in paise
    currency: "INR",
    receipt: `order_${order._id}`,
    notes: {
      orderId: order._id.toString(),
    },
  };

  let razorpayOrder;
  try {
    razorpayOrder = await razorpay.orders.create(options);
  } catch (error) {
    if (isRazorpayAuthError(error)) {
      const readableReason = getReadableRazorpayError(error);
      const wrappedError = new Error(
        `Razorpay authentication failed: ${readableReason}. ${getRazorpayAuthHint()}`
      );
      wrappedError.statusCode = 401;
      wrappedError.cause = error;
      throw wrappedError;
    }

    const message = getReadableRazorpayError(error);
    const wrappedError = new Error(`Razorpay order creation failed: ${message}`);
    wrappedError.statusCode = 502;
    wrappedError.cause = error;
    throw wrappedError;
  }

  return {
    paymentId: `pay_${Date.now()}`,
    razorpayOrderId: razorpayOrder.id,
    amount: order.totalAmount,
    currency: "INR",
    status: "created",
    provider: "razorpay",
  };
}

// Verify Razorpay payment signature
function verifyRazorpaySignature(razorpayOrderId, razorpayPaymentId, razorpaySignature) {
  if (!isRazorpayConfigured()) {
    // Mock verification always succeeds
    return true;
  }

  const generatedSignature = crypto
    .createHmac("sha256", getEnvValue("RAZORPAY_KEY_SECRET"))
    .update(`${razorpayOrderId}|${razorpayPaymentId}`)
    .digest("hex");

  return generatedSignature === razorpaySignature;
}

// Get Razorpay key ID for frontend
function getRazorpayKeyId() {
  return getEnvValue("RAZORPAY_KEY_ID");
}

// Get Stripe publishable key for frontend
function getStripePublishableKey() {
  return getEnvValue("STRIPE_PUBLISHABLE_KEY");
}

// Get available payment providers
function getAvailableProviders() {
  return {
    stripe: isStripeConfigured(),
    razorpay: isRazorpayConfigured(),
    mock: !isStripeConfigured() && !isRazorpayConfigured(),
  };
}

module.exports = {
  buildMockPayment,
  getReadableRazorpayError,
  createStripePaymentIntent,
  verifyStripePayment,
  createRazorpayOrder,
  verifyRazorpaySignature,
  getRazorpayKeyId,
  getStripePublishableKey,
  isStripeConfigured,
  isRazorpayConfigured,
  getAvailableProviders,
};
