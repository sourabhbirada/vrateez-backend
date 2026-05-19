const express = require("express");
const {
  getProducts,
  getProductsAdmin,
  getProductByIdAdmin,
  getProductBySlug,
  createProduct,
  updateProduct,
} = require("../controller/productController");
const { protect, adminOnly } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", getProducts);
router.get("/admin", protect, adminOnly, getProductsAdmin);
router.get("/admin/:id", protect, adminOnly, getProductByIdAdmin);
router.get("/:slug", getProductBySlug);
router.post("/", protect, adminOnly, createProduct);
router.patch("/:id", protect, adminOnly, updateProduct);

module.exports = router;
