require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDB();

// Middleware
const configuredClientUrl = process.env.CLIENT_URL || "http://localhost:5173";
const productionOrigin = configuredClientUrl.replace(/\/$/, "");

const allowedOrigins = new Set([
  productionOrigin,
  "https://prepvault.in",
  "https://www.prepvault.in",
  "http://localhost:5173",
  "http://localhost:8080",
  "http://localhost:8081", // ✅ ADD THIS
]);

// Include both www and non-www variants of CLIENT_URL automatically.
if (productionOrigin.startsWith("https://www.")) {
  allowedOrigins.add(productionOrigin.replace("https://www.", "https://"));
}
if (
  productionOrigin.startsWith("https://") &&
  !productionOrigin.includes("https://www.")
) {
  allowedOrigins.add(productionOrigin.replace("https://", "https://www."));
}

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);

    const normalizedOrigin = origin.replace(/\/$/, "");
    if (
      allowedOrigins.has(normalizedOrigin) ||
      /^https:\/\/prep-vault[\w-]*\.vercel\.app$/.test(normalizedOrigin)
    ) {
      return callback(null, true);
    }

    return callback(new Error(`Not allowed by CORS: ${normalizedOrigin}`));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  optionsSuccessStatus: 204,
};

app.use(cors(corsOptions));
app.options(/.*/, cors(corsOptions));
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
