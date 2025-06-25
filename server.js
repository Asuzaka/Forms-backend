require("dotenv").config({ path: ".env.local" });

const app = require("./app");

// Start server
app.listen(process.env.PORT, () => {
  console.log(`Server running on http://localhost:${process.env.PORT}`);
});
