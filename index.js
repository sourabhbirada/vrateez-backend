const dotenv = require("dotenv");
const app = require("./express");
const connectDB = require("./config/db");

dotenv.config();

const PORT = process.env.PORT || 3301;

async function startServer() {
    await connectDB();

    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
}

startServer();