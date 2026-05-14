const path = require("path");
const dotenv = require("dotenv");
dotenv.config({ path: path.resolve(__dirname, ".env") });

const app = require("./server");
const connectDB = require("./config/db");
const { ensureDefaultAdmin } = require("./services/seedAdmin");
require("./express");

const PORT = process.env.PORT || 3301;

async function startServer() {
    await connectDB();
    await ensureDefaultAdmin();
    const razorpayKeyId = process.env.RAZORPAY_KEY_ID || "not-set";
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
        console.log(`Razorpay key ID in use: ${razorpayKeyId}`);
    });
}

startServer();