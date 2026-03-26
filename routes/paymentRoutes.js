const express = require("express");
const {
  createPaymentIntent,
  verifyPayment,
  confirmPayment,
  confirmCodOrder,
} = require("../controller/paymentController");
const { protect } = require("../middleware/authMiddleware");
const { requireFields } = require("../middleware/validateMiddleware");

const router = express.Router();

router.use(protect);

// Create payment intent (Razorpay order)
router.post("/intent", requireFields(["orderId"]), createPaymentIntent);

// Verify Razorpay payment
router.post("/verify", requireFields(["orderId"]), verifyPayment);

// Confirm COD order
router.post("/confirm-cod", requireFields(["orderId"]), confirmCodOrder);

// Legacy mock payment confirmation (kept for backwards compatibility)
router.post("/confirm", requireFields(["paymentId"]), confirmPayment);

module.exports = router;
