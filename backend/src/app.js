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
// CORS (PRODUCTION + CLOUDFLARE + VERCEL + LOCAL)
// ========================
const isDev = config.nodeEnv !== 'production';

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  "http://127.0.0.1:5173",
  ...config.corsOrigins,
];

const originIsAllowed = (origin) =>
  allowedOrigins.includes(origin) ||
  origin.endsWith(".vercel.app") ||
  origin.includes(".trycloudflare.com");

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      if (originIsAllowed(origin)) {
        return callback(null, true);
      }
      if (isDev) {
        console.warn(`[CORS] Allowing unknown origin in dev mode: ${origin}`);
        return callback(null, true);
      }
      console.warn(`[CORS] Blocked origin: ${origin}`);
      return callback(new Error(`Origin ${origin} not allowed by CORS`));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"]
  })
);

// Log incoming origin for debugging
app.use((_req, res, next) => {
  const origin = _req.headers.origin;
  if (origin) {
    console.log(`[CORS] Incoming origin: ${origin}`);
  }
  next();
});

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