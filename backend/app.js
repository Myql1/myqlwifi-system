const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const winston = require('winston');
const dotenv = require('dotenv');
const { testConnection } = require('./config/database');
const { securityHeaders, csrfProtection, secureLogging, InputValidator, AdvancedRateLimiter } = require('./middleware/security');

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();

// Security middleware
app.use(helmet());
app.use(cors());
app.use(securityHeaders);
app.use(secureLogging);

// Advanced rate limiting
const advancedLimiter = new AdvancedRateLimiter();
app.use((req, res, next) => {
  const identifier = req.ip;
  if (!advancedLimiter.checkLimit(identifier)) {
    return res.status(429).json({ error: 'Too many requests' });
  }
  next();
});

// Standard rate limiting for API endpoints
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Stricter rate limiting for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 auth attempts per windowMs
  message: 'Too many authentication attempts, please try again later.'
});
app.use('/api/auth/', authLimiter);

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logger setup
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'myql-wifi-backend' },
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
  ],
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple(),
  }));
}

// Routes
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to MYQL WIFI API' });
});

// Input validation middleware for API routes
app.use('/api', (req, res, next) => {
  // Sanitize request body
  if (req.body && typeof req.body === 'object') {
    for (const key in req.body) {
      if (typeof req.body[key] === 'string') {
        req.body[key] = InputValidator.sanitizeString(req.body[key]);
      }
    }
  }

  // Validate specific fields
  if (req.body.phoneNumber && !InputValidator.validatePhoneNumber(req.body.phoneNumber)) {
    return res.status(400).json({ error: 'Invalid phone number format' });
  }

  if (req.body.email && !InputValidator.validateEmail(req.body.email)) {
    return res.status(400).json({ error: 'Invalid email format' });
  }

  next();
});

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/admin', require('./routes/admin'));

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Test database connection and start server
const PORT = process.env.PORT || 3000;
testConnection().then(() => {
  app.listen(PORT, '0.0.0.0', () => {
    logger.info(`Server running on port ${PORT}`);
  });
}).catch((error) => {
  logger.error('Failed to start server:', error);
  process.exit(1);
});

module.exports = app;