const express = require("express");
const cors = require("cors");
require("dotenv").config();
const connectDB = require("./config/db");

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static("uploads"));

// Routes
const searchRoutes = require("./routes/search");
const vaultRoutes = require("./routes/vault");
app.use("/api/search", searchRoutes);
app.use("/api/vault", vaultRoutes);

// Health check
app.get("/", (req, res) => {
  res.send("Backend is running");
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send("Something broke!");
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
