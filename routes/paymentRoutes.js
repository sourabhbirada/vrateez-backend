const express = require("express");
const {
  createPaymentIntent,
  confirmPayment,
} = require("../controller/paymentController");
const { protect } = require("../middleware/authMiddleware");
const { requireFields } = require("../middleware/validateMiddleware");

const router = express.Router();

router.use(protect);

router.post("/intent", requireFields(["orderId"]), createPaymentIntent);
router.post("/confirm", requireFields(["paymentId"]), confirmPayment);

module.exports = router;
