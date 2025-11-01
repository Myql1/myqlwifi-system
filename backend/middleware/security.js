const crypto = require('crypto');

// Data encryption utilities
class DataEncryption {
  constructor() {
    this.algorithm = 'aes-256-gcm';
    this.keyLength = 32; // 256 bits
    this.tagLength = 16; // 128 bits
    this.ivLength = 16; // 128 bits
  }

  // Generate encryption key from password
  generateKey(password, salt) {
    return crypto.scryptSync(password, salt, this.keyLength);
  }

  // Encrypt sensitive data
  encrypt(text, password) {
    const salt = crypto.randomBytes(32);
    const key = this.generateKey(password, salt);
    const iv = crypto.randomBytes(this.ivLength);

    const cipher = crypto.createCipher(this.algorithm, key);
    cipher.setAAD(Buffer.from('additional_authenticated_data'));

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const tag = cipher.getAuthTag();

    // Return format: salt:iv:tag:encrypted
    return salt.toString('hex') + ':' + iv.toString('hex') + ':' + tag.toString('hex') + ':' + encrypted;
  }

  // Decrypt sensitive data
  decrypt(encryptedText, password) {
    const parts = encryptedText.split(':');
    if (parts.length !== 4) {
      throw new Error('Invalid encrypted data format');
    }

    const salt = Buffer.from(parts[0], 'hex');
    const iv = Buffer.from(parts[1], 'hex');
    const tag = Buffer.from(parts[2], 'hex');
    const encrypted = parts[3];

    const key = this.generateKey(password, salt);

    const decipher = crypto.createDecipher(this.algorithm, key);
    decipher.setAAD(Buffer.from('additional_authenticated_data'));
    decipher.setAuthTag(tag);

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }
}

// Input validation and sanitization
class InputValidator {
  // Sanitize string input
  static sanitizeString(input) {
    if (typeof input !== 'string') return '';
    return input.trim().replace(/[<>]/g, '');
  }

  // Validate phone number (Ugandan format)
  static validatePhoneNumber(phone) {
    const ugandanPhoneRegex = /^(\+256|256|0)[17]\d{8}$/;
    return ugandanPhoneRegex.test(phone);
  }

  // Validate email
  static validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Validate amount (positive number)
  static validateAmount(amount) {
    const num = parseFloat(amount);
    return !isNaN(num) && num > 0 && num <= 1000000; // Max 1M UGX
  }

  // Validate voucher code
  static validateVoucherCode(code) {
    const voucherRegex = /^[A-Z0-9]{8}$/;
    return voucherRegex.test(code);
  }

  // Sanitize SQL input (basic protection)
  static sanitizeSQL(input) {
    if (typeof input !== 'string') return input;
    return input.replace(/['";\\]/g, '');
  }
}

// Rate limiting for specific endpoints
class AdvancedRateLimiter {
  constructor() {
    this.requests = new Map();
  }

  // Check if request should be allowed
  checkLimit(identifier, maxRequests = 100, windowMs = 15 * 60 * 1000) {
    const now = Date.now();
    const windowStart = now - windowMs;

    if (!this.requests.has(identifier)) {
      this.requests.set(identifier, []);
    }

    const userRequests = this.requests.get(identifier);

    // Remove old requests outside the window
    const validRequests = userRequests.filter(time => time > windowStart);

    if (validRequests.length >= maxRequests) {
      return false; // Rate limit exceeded
    }

    // Add current request
    validRequests.push(now);
    this.requests.set(identifier, validRequests);

    return true; // Request allowed
  }

  // Clean up old entries periodically
  cleanup() {
    const now = Date.now();
    const oneHourAgo = now - (60 * 60 * 1000);

    for (const [identifier, requests] of this.requests.entries()) {
      const validRequests = requests.filter(time => time > oneHourAgo);
      if (validRequests.length === 0) {
        this.requests.delete(identifier);
      } else {
        this.requests.set(identifier, validRequests);
      }
    }
  }
}

// Security headers middleware
const securityHeaders = (req, res, next) => {
  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY');

  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // Enable XSS protection
  res.setHeader('X-XSS-Protection', '1; mode=block');

  // Referrer policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Content Security Policy
  res.setHeader('Content-Security-Policy',
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline'; " +
    "style-src 'self' 'unsafe-inline'; " +
    "img-src 'self' data: https:; " +
    "font-src 'self'; " +
    "connect-src 'self'; " +
    "frame-ancestors 'none';"
  );

  // HSTS (HTTP Strict Transport Security)
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }

  next();
};

// CSRF protection
const csrfProtection = (req, res, next) => {
  // Generate CSRF token
  const generateToken = () => {
    return crypto.randomBytes(32).toString('hex');
  };

  // For state-changing requests, verify CSRF token
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
    const token = req.headers['x-csrf-token'] || req.body._csrf;

    if (!token) {
      return res.status(403).json({ error: 'CSRF token missing' });
    }

    // In a real implementation, you'd verify the token against a session
    // For now, we'll just check if it's present
  }

  // Add CSRF token to response
  res.locals.csrfToken = generateToken();
  next();
};

// Request logging with sensitive data masking
const secureLogging = (req, res, next) => {
  const originalSend = res.send;

  res.send = function(data) {
    // Mask sensitive data in logs
    const maskSensitiveData = (obj) => {
      if (typeof obj !== 'object' || obj === null) return obj;

      const masked = { ...obj };

      // Mask sensitive fields
      const sensitiveFields = ['password', 'token', 'apiKey', 'secret', 'credit_card', 'phone'];

      for (const field of sensitiveFields) {
        if (masked[field]) {
          masked[field] = '***MASKED***';
        }
      }

      return masked;
    };

    const logData = {
      method: req.method,
      url: req.url,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      timestamp: new Date().toISOString(),
      requestBody: maskSensitiveData(req.body),
      responseStatus: res.statusCode
    };

    console.log('SECURE_LOG:', JSON.stringify(logData));

    originalSend.call(this, data);
  };

  next();
};

module.exports = {
  DataEncryption,
  InputValidator,
  AdvancedRateLimiter,
  securityHeaders,
  csrfProtection,
  secureLogging
};