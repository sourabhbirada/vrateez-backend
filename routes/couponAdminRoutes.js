const express = require("express");
const {
  listCoupons,
  createCoupon,
  updateCoupon,
  deleteCoupon,
} = require("../controller/couponAdminController");
const { protect, adminOnly } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", protect, adminOnly, listCoupons);
router.post("/", protect, adminOnly, createCoupon);
router.patch("/:id", protect, adminOnly, updateCoupon);
router.delete("/:id", protect, adminOnly, deleteCoupon);

module.exports = router;
