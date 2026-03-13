const express = require("express");
const { health } = require("../controller/healthController");

const router = express.Router();

router.get("/health", health);

module.exports = router;
