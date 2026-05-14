const express = require("express");
const {
  createBulkOrder,
  listBulkOrdersAdmin,
  updateBulkOrderStatus,
} = require("../controller/bulkOrderController");
const { protect, adminOnly } = require("../middleware/authMiddleware");
const { requireFields } = require("../middleware/validateMiddleware");

const router = express.Router();

router.post(
  "/",
  requireFields(["yourName", "phone", "email", "inquiryType"]),
  createBulkOrder
);

router.get("/admin", protect, adminOnly, listBulkOrdersAdmin);
router.patch("/:id/status", protect, adminOnly, updateBulkOrderStatus);

module.exports = router;
