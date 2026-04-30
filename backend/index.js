require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");

const app = express();
const PORT = process.env.PORT || 5000;
const isProduction = process.env.NODE_ENV === "production";

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
  "http://localhost:8081", // anshika system
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

    if (!isProduction) {
      try {
        const parsedOrigin = new URL(normalizedOrigin);
        const isLocalDevHost =
          parsedOrigin.hostname === "localhost" ||
          parsedOrigin.hostname === "127.0.0.1";

        if (isLocalDevHost) {
          return callback(null, true);
        }
      } catch {
        // Fall through to strict allowlist checks.
      }
    }

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

// Ensure unmatched API routes always return JSON instead of Express HTML.
app.use("/api", (req, res) => {
  res.status(404).json({
    error: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);

  const statusCode = err.status || err.statusCode || 500;
  const message = err.message || "Something broke!";

  if (req.originalUrl.startsWith("/api/")) {
    return res.status(statusCode).json({ error: message });
  }

  res.status(statusCode).send("Something broke!");
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
