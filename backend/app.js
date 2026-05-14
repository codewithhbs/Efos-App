const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");

const app = express();
const routes = require("./routes/index");

// ========================
// MIDDLEWARE
// ========================
app.use(
  cors({
    origin: true, // or your frontend URL
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));
app.use(cookieParser());

app.set("trust proxy", 1);

// ========================
// STATIC FILES (FIXED ✅)
// ========================
app.use("/uploads", express.static("uploads"));

// ========================
// HEALTH CHECK
// ========================
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "API is running 🚀",
  });
});

// ========================
// ROUTES
// ========================
app.use("/api/v1", routes);

// ========================
// 404 HANDLER
// ========================
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

// ========================
// GLOBAL ERROR HANDLER
// ========================
app.use((err, req, res, next) => {
  console.error("🔥 Error:", err.stack);

  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
});

module.exports = app;