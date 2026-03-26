const express = require("express");
const {
  createGuestOrder,
  createGuestPayment,
  verifyGuestPayment,
  getGuestOrder,
  confirmGuestCodOrder,
} = require("../controller/guestOrderController");
const { requireFields } = require("../middleware/validateMiddleware");

const router = express.Router();

// Create guest order
router.post(
  "/orders",
  requireFields(["items", "shippingAddress", "paymentMethod", "guestInfo"]),
  createGuestOrder
);

// Create payment for guest order
router.post(
  "/payments/create",
  requireFields(["orderId", "email"]),
  createGuestPayment
);

// Verify guest payment
router.post(
  "/payments/verify",
  requireFields(["orderId", "email"]),
  verifyGuestPayment
);

// Confirm COD order for guest
router.post(
  "/orders/confirm-cod",
  requireFields(["orderId", "email"]),
  confirmGuestCodOrder
);

// Get guest order by ID
router.get("/orders/:id", getGuestOrder);

module.exports = router;
