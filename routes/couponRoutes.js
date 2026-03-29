const express = require("express");
const { validateCoupon } = require("../controller/couponController");
const { requireFields } = require("../middleware/validateMiddleware");

const router = express.Router();

router.post("/validate", requireFields(["couponCode", "subtotal"]), validateCoupon);

module.exports = router;
