const dotenv = require("dotenv");
dotenv.config();

const app = require("./server");
const connectDB = require("./config/db");
require("./express");

const PORT = process.env.PORT || 3301;

async function startServer() {
    await connectDB();
    const razorpayKeyId = process.env.RAZORPAY_KEY_ID || "not-set";
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
        console.log(`Razorpay key ID in use: ${razorpayKeyId}`);
    });
}

startServer();