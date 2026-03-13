const express = require("express");
const {
  getCart,
  addToCart,
  updateCartItem,
  removeCartItem,
  clearCart,
} = require("../controller/cartController");
const { protect } = require("../middleware/authMiddleware");
const { requireFields } = require("../middleware/validateMiddleware");

const router = express.Router();

router.use(protect);

router.get("/", getCart);
router.post("/items", requireFields(["productId"]), addToCart);
router.patch("/items/:productId", requireFields(["quantity"]), updateCartItem);
router.delete("/items/:productId", removeCartItem);
router.delete("/", clearCart);

module.exports = router;
