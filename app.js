const express = require("express");
const path = require("path");
const rateLimit = require("express-rate-limit");
const sanitize = require("./src/middleware/sanitize");
const helmet = require("helmet");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const app = express();

const auth = require("./src/routes/authRoute");
const errorController = require("./src/controllers/errorController");
const ResponseError = require("./src/services/ResponseError");

const corsOption = {
  origin: process.env.FRONTEND_URL,
  credentials: true,
};
// Limit requests From IP
const limier = rateLimit({
  max: 500,
  windowMs: 60 * 60 * 1000,
  message: "Too many requests from this IP, please try again in an hour!",
});

// set Security HTTP HEADERS
app.use(helmet());

// Cookie Parser
app.use(cookieParser());
// Body Parser
app.use(express.json({ limit: "20kb" }));

// Data sanitization against NoSQL injection
app.use(sanitize);

// CORS
app.use(cors(corsOption));

app.use("/api", limier);

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

app.use("/v1/auth", auth);

app.get("/api", (req, res) => {
  res.json({ message: "Hello from Express!" });
});

// 404 errors
app.use("*splat", (req, res, next) => {
  next(new ResponseError(`Can't reach ${req.originalUrl} on this server`, 404));
});

// Central error handling
app.use(errorController);

module.exports = app;
