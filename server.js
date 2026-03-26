const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const morgan = require("morgan");

const app = express();

app.use(express.json({limit: '10mb'}));
app.use(express.urlencoded({ extended: true }));
app.use(helmet({
  contentSecurityPolicy: false,
}));
app.use(morgan("dev"));

app.use(
  cors({
    origin: "*",
  }),
);

module.exports = app;
