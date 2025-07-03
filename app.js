const express = require("express");
const path = require("path");
const rateLimit = require("express-rate-limit");
const sanitize = require("./src/middleware/sanitize");
const helmet = require("helmet");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const app = express();

const upload = require("./src/routes/uploadRoute");
const auth = require("./src/routes/authRoute");
const forms = require("./src/routes/formRoute");
const template = require("./src/routes/templateRoute");
const users = require("./src/routes/userRoute");
const search = require("./src/routes/searchRoute");
const commentRoutes = require("./src/routes/commentRoute");
const errorController = require("./src/controllers/errorController");
const ResponseError = require("./src/services/ResponseError");

const corsOption = {
  origin: process.env.FROTEND_ADDRESS,
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
app.use(cookieParser(process.env.JWT_SECRET));
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

app.use("/v1/upload", upload);
app.use("/v1/auth", auth);
app.use("/v1/templates", template);
app.use("/v1/forms", forms);
app.use("/v1/users", users);
app.use("/v1/search", search);
app.use("/v1/comments", commentRoutes);

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
