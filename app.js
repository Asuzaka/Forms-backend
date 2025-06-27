const express = require("express");
const path = require("path");
const rateLimit = require("express-rate-limit");
const sanitize = require("express-mongo-sanitize");
const helmet = require("helmet");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const bodyParser = require("body-parser");
const app = express();

const corsOption = {
  origin: process.env.FRONTEND_URL,
  credentials: true,
};

// set Security HTTP HEADERS
app.use(helmet());

// Limit requests From IP
const limier = rateLimit({
  max: 500,
  windowMs: 60 * 60 * 1000,
  message: "Too many requests from this IP, please try again in an hour!",
});

app.use("/api", limier);

// Data sanitization against NoSQL injection
app.use(sanitize());

// Cookie Parser
app.use(cookieParser());
// CORS
app.use(cors(corsOption));
// Body Parser
app.use(express.json({ limit: "20kb" }));

// Middlware
app.use((req, res, next) => {
  next();
});

app.use(
  "/public",
  (req, res, next) => {
    res.setHeader("Cross-Origin-Resource-Policy", "cross-origin"); // Important for images
    next();
  },
  express.static(path.join(__dirname, "public"))
);

// Basic route
app.get("/api", (req, res) => {
  res.json({ message: "Hello from Express!" });
});

console.log(process.env.FROTEND_ADDRESS);

module.exports = app;
