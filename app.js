const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const app = express();

const corsOption = {
  origin: process.env.FRONTEND_URL,
};

// Middleware
app.use(cors(corsOption)); // Allow frontend requests
app.use(bodyParser.json()); // Parse JSON requests

// Basic route
app.get("/api", (req, res) => {
  res.json({ message: "Hello from Express!" });
});

console.log(process.env.FROTEND_ADDRESS);

module.exports = app;
