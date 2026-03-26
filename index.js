const dotenv = require("dotenv");
const app = require("./server");
const connectDB = require("./config/db");
require("./express")

dotenv.config();
const PORT = process.env.PORT || 3301;

async function startServer() {
    await connectDB();
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
}

startServer();