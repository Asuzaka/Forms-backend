require("dotenv").config({ path: ".env.local" });
const http = require("http");
const mongoose = require("mongoose");
const setupSocket = require("./src/socket");

const mongodbURL = process.env.DATABASE.replace(
  "<PASSWORD>",
  process.env.DATABASE_PASSWORD
);

mongoose.connect(mongodbURL, { dbName: "Forms" }).then((_) => {
  console.log("Succesfully connected to a Database.");
});

const app = require("./app");
const server = http.createServer(app);
const io = setupSocket(server);

console.log("Socket.IO instance created:", !!io);

// Start server
server.listen(process.env.PORT, () => {
  console.log(`Server running on http://localhost:${process.env.PORT} `);
  console.log(
    `WebSocket endpoint: ws://localhost:${process.env.PORT}/socket.io/`
  );
});
