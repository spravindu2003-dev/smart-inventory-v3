const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const config = require('./config/env');

const errorHandler = require('./middleware/errorHandler');

const app = express();

// Middleware
app.use(helmet());
app.use(cors({ origin: config.corsOrigin }));
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Middleware: auto-add success:true to all JSON responses
app.use((_req, res, next) => {
  const originalJson = res.json.bind(res);
  res.json = function (body) {
    if (body && typeof body === 'object' && !Array.isArray(body) && body.success === undefined) {
      return originalJson({ success: true, ...body });
    }
    return originalJson(body);
  };
  next();
});

// Routes
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/products', require('./routes/productRoutes'));
app.use('/api/activities', require('./routes/activityRoutes'));
app.use('/api/sales', require('./routes/saleRoutes'));
app.use('/api/insights', require('./routes/insightsRoutes'));
app.use('/api/reports', require('./routes/reportsRoutes'));

// Global error handler (must be after routes)
app.use(errorHandler);

module.exports = app;
