const express = require("express");
const { createBulkOrder } = require("../controller/bulkOrderController");
const { requireFields } = require("../middleware/validateMiddleware");

const router = express.Router();

router.post(
  "/",
  requireFields(["yourName", "phone", "email", "inquiryType"]),
  createBulkOrder
);

module.exports = router;
