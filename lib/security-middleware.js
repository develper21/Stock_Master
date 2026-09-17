import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import validator from 'validator';
import xss from 'xss';

// Rate limiting configurations
export const createRateLimit = (options = {}) => {
  return rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: {
      error: 'Too many requests from this IP, please try again later.',
    },
    standardHeaders: true,
    legacyHeaders: false,
    ...options,
  });
};

// Strict rate limiting for authentication endpoints
export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 auth requests per windowMs
  message: {
    error: 'Too many authentication attempts, please try again later.',
  },
  skipSuccessfulRequests: true,
});

// API rate limiting
export const apiRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each IP to 1000 API requests per windowMs
  message: {
    error: 'Too many API requests, please try again later.',
  },
});

// Security headers configuration
export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      scriptSrc: ["'self'", "'unsafe-eval'"],
      connectSrc: ["'self'", "https://api.supabase.co"],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      manifestSrc: ["'self'"],
    },
  },
  crossOriginEmbedderPolicy: false,
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
});

// Input validation utilities
export const validateInput = {
  email: (email) => {
    return validator.isEmail(email) ? null : 'Invalid email format';
  },
  
  password: (password) => {
    if (!password || password.length < 8) {
      return 'Password must be at least 8 characters long';
    }
    if (!validator.isStrongPassword(password, {
      minLength: 8,
      minLowercase: 1,
      minUppercase: 1,
      minNumbers: 1,
      minSymbols: 1
    })) {
      return 'Password must contain uppercase, lowercase, number, and special character';
    }
    return null;
  },
  
  name: (name) => {
    if (!name || name.length < 2) {
      return 'Name must be at least 2 characters long';
    }
    if (!validator.isAlpha(name.replace(/\s/g, ''))) {
      return 'Name can only contain letters and spaces';
    }
    if (name.length > 50) {
      return 'Name must be less than 50 characters';
    }
    return null;
  },
  
  quantity: (quantity) => {
    if (!validator.isNumeric(quantity.toString())) {
      return 'Quantity must be a number';
    }
    const num = parseFloat(quantity);
    if (num < 0) {
      return 'Quantity cannot be negative';
    }
    return null;
  },
  
  price: (price) => {
    if (!validator.isDecimal(price.toString())) {
      return 'Price must be a valid decimal number';
    }
    const num = parseFloat(price);
    if (num < 0) {
      return 'Price cannot be negative';
    }
    return null;
  },
  
  phone: (phone) => {
    if (!validator.isMobilePhone(phone, 'any')) {
      return 'Invalid phone number format';
    }
    return null;
  },
  
  url: (url) => {
    if (url && !validator.isURL(url)) {
      return 'Invalid URL format';
    }
    return null;
  },
  
  date: (date) => {
    if (!validator.isISO8601(date)) {
      return 'Invalid date format';
    }
    return null;
  },
  
  uuid: (uuid) => {
    if (!validator.isUUID(uuid)) {
      return 'Invalid UUID format';
    }
    return null;
  },
};

// XSS protection
export const sanitizeInput = (input) => {
  if (typeof input !== 'string') {
    return input;
  }
  
  return xss(input, {
    whiteList: {
      a: ['href', 'title', 'target'],
      b: [],
      i: [],
      em: [],
      strong: [],
      p: [],
      br: [],
      ul: [],
      ol: [],
      li: [],
    },
    stripIgnoreTag: true,
    stripIgnoreTagBody: ['script'],
  });
};

// SQL injection protection (basic pattern matching)
export const detectSQLInjection = (input) => {
  if (typeof input !== 'string') {
    return false;
  }
  
  const sqlPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)/i,
    /(--)|(\bOR\b.*=.*\bOR\b)|(\bAND\b.*=.*\bAND\b)/i,
    /(\bWHERE\b.*\bOR\b)|(\bWHERE\b.*\bAND\b)/i,
    /(\bFROM\b.*\bINFORMATION_SCHEMA\b)/i,
    /(\bEXEC\b.*\bXP_)/i,
  ];
  
  return sqlPatterns.some(pattern => pattern.test(input));
};

// Request validation middleware
export const validateRequest = (schema) => {
  return (req, res, next) => {
    const errors = [];
    
    for (const [field, rules] of Object.entries(schema)) {
      const value = req.body[field] || req.query[field] || req.params[field];
      
      if (rules.required && (!value || value === '')) {
        errors.push(`${field} is required`);
        continue;
      }
      
      if (value && rules.type && typeof value !== rules.type) {
        errors.push(`${field} must be of type ${rules.type}`);
        continue;
      }
      
      if (value && rules.validate) {
        const validationError = rules.validate(value);
        if (validationError) {
          errors.push(`${field}: ${validationError}`);
        }
      }
      
      if (value && rules.sanitize) {
        if (req.body[field]) req.body[field] = sanitizeInput(value);
        if (req.query[field]) req.query[field] = sanitizeInput(value);
        if (req.params[field]) req.params[field] = sanitizeInput(value);
      }
    }
    
    if (errors.length > 0) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors,
      });
    }
    
    next();
  };
};

// CORS configuration
export const corsOptions = {
  origin: (origin, callback) => {
    const allowedOrigins = process.env.ALLOWED_ORIGINS 
      ? process.env.ALLOWED_ORIGINS.split(',')
      : ['http://localhost:3000'];
    
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
};

// Security audit logging
export const logSecurityEvent = (event, details) => {
  const logEntry = {
    timestamp: new Date().toISOString(),
    event,
    details,
    ip: details.ip || 'unknown',
    userAgent: details.userAgent || 'unknown',
  };
  
  console.warn('Security Event:', logEntry);
  
  // In production, send to security monitoring service
  if (process.env.NODE_ENV === 'production') {
    // Send to Sentry, security monitoring service, etc.
  }
};

// IP blacklist management
const ipBlacklist = new Set();

export const addToBlacklist = (ip, duration = 24 * 60 * 60 * 1000) => {
  ipBlacklist.add(ip);
  setTimeout(() => {
    ipBlacklist.delete(ip);
  }, duration);
  
  logSecurityEvent('IP_BLACKLISTED', { ip, duration });
};

export const isBlacklisted = (ip) => {
  return ipBlacklist.has(ip);
};

// Middleware to check IP blacklist
export const checkBlacklist = (req, res, next) => {
  const ip = req.ip || req.connection.remoteAddress;
  
  if (isBlacklisted(ip)) {
    logSecurityEvent('BLACKLISTED_ACCESS_ATTEMPT', { ip, userAgent: req.get('User-Agent') });
    return res.status(403).json({ error: 'Access denied' });
  }
  
  next();
};
