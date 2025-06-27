require("dotenv").config({ path: ".env.local" });
const mongoose = require("mongoose");

const mongodbURL = process.env.DATABASE.replace(
  "<PASSWORD>",
  process.env.DATABASE_PASSWORD
);

mongoose.connect(mongodbURL, { dbName: "Forms" }).then((_) => {
  console.log("Succesfully connected to a Database.");
});

const app = require("./app");

// Start server
app.listen(process.env.PORT, () => {
  console.log(`Server running on http://localhost:${process.env.PORT}`);
});
