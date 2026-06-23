const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const config = require('./config/env');

const errorHandler = require('./middleware/errorHandler');

const app = express();

// ========================
// SECURITY MIDDLEWARE
// ========================
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ========================
// CORS (PRODUCTION + VERCEL + LOCAL FIX)
// ========================
const allowedOrigins = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "https://smart-inventory-capstone-v3.vercel.app"
];

app.use(
  cors({
    origin: function (origin, callback) {
      // allow tools like Postman / server requests
      if (!origin) return callback(null, true);

      // allow local + production + Vercel previews
      if (
        allowedOrigins.includes(origin) ||
        origin.endsWith(".vercel.app")
      ) {
        return callback(null, true);
      }

      console.log("❌ Blocked CORS origin:", origin);
      return callback(new Error("CORS blocked"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"]
  })
);

// ========================
// AUTO SUCCESS WRAPPER
// ========================
app.use((_req, res, next) => {
  const originalJson = res.json.bind(res);

  res.json = function (body) {
    if (
      body &&
      typeof body === "object" &&
      !Array.isArray(body) &&
      body.success === undefined
    ) {
      return originalJson({ success: true, ...body });
    }
    return originalJson(body);
  };

  next();
});

// ========================
// HEALTH CHECK
// ========================
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString()
  });
});

// ========================
// ROUTES
// ========================
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/products', require('./routes/productRoutes'));
app.use('/api/activities', require('./routes/activityRoutes'));
app.use('/api/sales', require('./routes/saleRoutes'));
app.use('/api/insights', require('./routes/insightsRoutes'));
app.use('/api/reports', require('./routes/reportsRoutes'));

// ========================
// GLOBAL ERROR HANDLER
// ========================
app.use(errorHandler);

module.exports = app;