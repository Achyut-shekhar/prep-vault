const express = require("express");
const cors = require("cors");
require("dotenv").config();
const connectDB = require("./config/db");

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDB();

// Middleware
const allowedOrigin = (process.env.CLIENT_URL || "http://localhost:5173").replace(/\/$/, "");
app.use(
  cors({
    origin: allowedOrigin,
    credentials: true,
  }),
);
app.use(express.json());
app.use("/uploads", express.static("uploads"));

// Routes
const authRoutes = require("./routes/auth");
const searchRoutes = require("./routes/search");
const vaultRoutes = require("./routes/vault");
app.use("/api/auth", authRoutes);
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
