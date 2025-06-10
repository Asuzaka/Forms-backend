require("dotenv").config({ path: ".env.local" });
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");

const app = express();
const PORT = process.env.PORT || 4000;

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

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
