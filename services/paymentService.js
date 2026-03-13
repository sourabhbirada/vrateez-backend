function buildMockPayment(order) {
  return {
    paymentId: `pay_${Date.now()}`,
    transactionId: `txn_${Math.random().toString(36).slice(2, 10)}`,
    amount: order.totalAmount,
    currency: "INR",
    status: "created",
  };
}

module.exports = { buildMockPayment };
