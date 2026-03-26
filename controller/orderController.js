const Cart = require("../model/Cart");
const Order = require("../model/Order");
const Product = require("../model/Product");
const asyncHandler = require("../utilits/asyncHandler");
const ApiError = require("../utilits/ApiError");
const { ok } = require("../utilits/response");

const createOrder = asyncHandler(async (req, res) => {
  const { shippingAddress, paymentMethod, notes } = req.body;

  const cart = await Cart.findOne({ user: req.user._id }).populate("items.product");

  if (!cart || cart.items.length === 0) {
    throw new ApiError(400, "Cart is empty");   
  }

  const items = [];
  let subtotal = 0;

  for (const item of cart.items) {
    const product = await Product.findById(item.product._id);

    if (!product || !product.isActive) {
      throw new ApiError(400, `Product unavailable: ${item.product.name}`);
    }

    items.push({
      product: product._id,
      name: product.name,
      image: product.image,
      price: product.price,
      quantity: item.quantity,
    });

    subtotal += product.price * item.quantity;
  }

  const shippingCharge = subtotal >= 499 ? 0 : 49;
  const totalAmount = subtotal + shippingCharge;

  const order = await Order.create({
    user: req.user._id,
    items,
    shippingAddress,
    paymentMethod,
    notes,
    subtotal,
    shippingCharge,
    discountAmount: 0,
    totalAmount,
  });

  cart.items = [];
  await cart.save();

  return ok(res, { order }, "Order created", 201);
});

const getMyOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
  return ok(res, { orders });
});

const getOrderById = asyncHandler(async (req, res) => {
  const order = await Order.findOne({ _id: req.params.id, user: req.user._id });

  if (!order) {
    throw new ApiError(404, "Order not found");
  }

  return ok(res, { order });
});

const updateOrderStatus = asyncHandler(async (req, res) => {
  const { orderStatus, paymentStatus } = req.body;

  const order = await Order.findById(req.params.id);
  if (!order) {
    throw new ApiError(404, "Order not found");
  }

  if (orderStatus) {
    order.orderStatus = orderStatus;
  }

  if (paymentStatus) {
    order.paymentStatus = paymentStatus;
  }

  await order.save();

  return ok(res, { order }, "Order updated");
});

module.exports = {
  createOrder,
  getMyOrders,
  getOrderById,
  updateOrderStatus,
};
