const dotenv = require("dotenv");
dotenv.config();

const mongoose = require("mongoose");
const app = require("./app");

async function connectDatabase() {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    console.warn("MONGODB_URI is not set. Database connection skipped.");
    return;
  }

  await mongoose.connect(uri);
  console.log("Connected to MongoDB");
}

const PORT = process.env.PORT || 5000;

connectDatabase()
  .then(() => {
    app.listen(PORT, () => {
      const base = `http://localhost:${PORT}`;
      console.log(`Server is running on port ${PORT}`);
      console.log(`GET  ${base}/health`);
      console.log(`GET  ${base}/api/content`);
      console.log(`GET  ${base}/api/content/generate`);
      console.log(`POST ${base}/api/content/generate`);
    });
  })
  .catch((err) => {
    console.error("Failed to start server:", err);
    process.exit(1);
  });
