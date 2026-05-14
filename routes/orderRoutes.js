const express = require("express");
const {
  createOrder,
  getMyOrders,
  getOrderById,
  listOrdersAdmin,
  updateOrderStatus,
} = require("../controller/orderController");
const { protect, adminOnly } = require("../middleware/authMiddleware");
const { requireFields } = require("../middleware/validateMiddleware");

const router = express.Router();

router.use(protect);

router.post(
  "/",
  requireFields(["shippingAddress", "paymentMethod"]),
  createOrder
);
router.get("/me", getMyOrders);
router.get("/admin", adminOnly, listOrdersAdmin);
router.get("/:id", getOrderById);
router.patch("/:id/status", adminOnly, updateOrderStatus);

module.exports = router;
