const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    order: { type: mongoose.Schema.Types.ObjectId, ref: "Order", required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    provider: { type: String, enum: ["mock", "razorpay"], default: "mock" },
    paymentId: { type: String, required: true, unique: true },
    transactionId: { type: String },
    amount: { type: Number, required: true },
    currency: { type: String, default: "INR" },
    status: { type: String, enum: ["created", "success", "failed"], default: "created" },
    metadata: { type: Object },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Payment", paymentSchema);
