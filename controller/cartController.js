const Cart = require("../model/Cart");
const Product = require("../model/Product");
const asyncHandler = require("../utilits/asyncHandler");
const ApiError = require("../utilits/ApiError");
const { ok } = require("../utilits/response");

async function getOrCreateCart(userId) {
  let cart = await Cart.findOne({ user: userId });
  if (!cart) {
    cart = await Cart.create({ user: userId, items: [] });
  }
  return cart;
}

const getCart = asyncHandler(async (req, res) => {
  const cart = await getOrCreateCart(req.user._id);
  await cart.populate("items.product");
  return ok(res, { cart });
});

const addToCart = asyncHandler(async (req, res) => {
  const { productId, quantity = 1 } = req.body;

  const product = await Product.findById(productId);
  if (!product || !product.isActive) {
    throw new ApiError(404, "Product not found");
  }

  const cart = await getOrCreateCart(req.user._id);
  const existing = cart.items.find((item) => String(item.product) === String(productId));

  if (existing) {
    existing.quantity += Number(quantity);
  } else {
    cart.items.push({ product: productId, quantity: Number(quantity) });
  }

  await cart.save();
  await cart.populate("items.product");

  return ok(res, { cart }, "Item added to cart");
});

const updateCartItem = asyncHandler(async (req, res) => {
  const { quantity } = req.body;

  const cart = await getOrCreateCart(req.user._id);
  const item = cart.items.find((it) => String(it.product) === req.params.productId);

  if (!item) {
    throw new ApiError(404, "Cart item not found");
  }

  if (Number(quantity) <= 0) {
    cart.items = cart.items.filter((it) => String(it.product) !== req.params.productId);
  } else {
    item.quantity = Number(quantity);
  }

  await cart.save();
  await cart.populate("items.product");

  return ok(res, { cart }, "Cart updated");
});

const removeCartItem = asyncHandler(async (req, res) => {
  const cart = await getOrCreateCart(req.user._id);
  cart.items = cart.items.filter((it) => String(it.product) !== req.params.productId);
  await cart.save();
  await cart.populate("items.product");

  return ok(res, { cart }, "Item removed");
});

const clearCart = asyncHandler(async (req, res) => {
  const cart = await getOrCreateCart(req.user._id);
  cart.items = [];
  await cart.save();

  return ok(res, { cart }, "Cart cleared");
});

module.exports = {
  getCart,
  addToCart,
  updateCartItem,
  removeCartItem,
  clearCart,
};
