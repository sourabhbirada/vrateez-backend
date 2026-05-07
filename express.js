const app = require("./server");
const healthRoutes = require("./routes/healthRoutes");
const authRoutes = require("./routes/authRoutes");
const productRoutes = require("./routes/productRoutes");
const cartRoutes = require("./routes/cartRoutes");
const orderRoutes = require("./routes/orderRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const couponRoutes = require("./routes/couponRoutes");
const couponAdminRoutes = require("./routes/couponAdminRoutes");
const categoryRoutes = require("./routes/categoryRoutes");
const bannerRoutes = require("./routes/bannerRoutes");
const uploadRoutes = require("./routes/uploadRoutes");
const bulkOrderRoutes = require("./routes/bulkOrderRoutes");
const guestOrderRoutes = require("./routes/guestOrderRoutes");
const { notFound, errorHandler } = require("./utilits/errorMiddleware");


app.get("/", (_req, res) => {
	res.status(200).json({ status: true, message: "Vrateez API is running" });
});
app.use("/api", healthRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/coupons", couponRoutes);
app.use("/api/admin/coupons", couponAdminRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/banners", bannerRoutes);
app.use("/api/uploads", uploadRoutes);
app.use("/api/guest", guestOrderRoutes);
app.use("/api/bulk-order", bulkOrderRoutes);
app.use("/bulk-order", bulkOrderRoutes);
app.use(notFound);
app.use(errorHandler);

module.exports = app;
