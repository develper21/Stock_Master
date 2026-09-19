export class AppError extends Error {
  constructor(message, statusCode = 500, code = null) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    this.timestamp = new Date().toISOString();
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      statusCode: this.statusCode,
      code: this.code,
      timestamp: this.timestamp,
      stack: this.stack
    };
  }
}

export function createError(message, statusCode = 500, code = null) {
  return new AppError(message, statusCode, code);
}

export function handleApiError(error, context = {}) {
  console.group('🚨 API Error');
  console.error('Error:', error);
  console.error('Context:', context);
  console.error('Timestamp:', new Date().toISOString());
  console.groupEnd();

  // Log to external service in production
  if (process.env.NODE_ENV === 'production') {
    // TODO: Send to error tracking service (Sentry, LogRocket, etc.)
    console.error('Production error detected:', error);
  }

  // Return appropriate error response
  if (error instanceof AppError) {
    return {
      error: error.message,
      code: error.code,
      statusCode: error.statusCode,
      timestamp: error.timestamp
    };
  }

  // Handle database errors
  if (error.code) {
    switch (error.code) {
      case '23505': // Unique violation
        return {
          error: 'Record already exists',
          code: 'DUPLICATE_RECORD',
          statusCode: 409
        };
      case '23503': // Foreign key violation
        return {
          error: 'Referenced record does not exist',
          code: 'FOREIGN_KEY_VIOLATION',
          statusCode: 400
        };
      case '23502': // Not null violation
        return {
          error: 'Required field is missing',
          code: 'REQUIRED_FIELD_MISSING',
          statusCode: 400
        };
      case 'PGRST116': // Permission denied
        return {
          error: 'Insufficient permissions',
          code: 'PERMISSION_DENIED',
          statusCode: 403
        };
      default:
        return {
          error: 'Database operation failed',
          code: 'DATABASE_ERROR',
          statusCode: 500
        };
    }
  }

  // Handle JWT errors
  if (error.name === 'JsonWebTokenError') {
    return {
      error: 'Invalid authentication token',
      code: 'INVALID_TOKEN',
      statusCode: 401
    };
  }

  if (error.name === 'TokenExpiredError') {
    return {
      error: 'Authentication token expired',
      code: 'TOKEN_EXPIRED',
      statusCode: 401
    };
  }

  // Handle network errors
  if (error.code === 'ECONNREFUSED') {
    return {
      error: 'Connection refused',
      code: 'CONNECTION_ERROR',
      statusCode: 503
    };
  }

  if (error.code === 'ETIMEDOUT') {
    return {
      error: 'Request timeout',
      code: 'TIMEOUT_ERROR',
      statusCode: 504
    };
  }

  // Default error
  return {
    error: error.message || 'An unexpected error occurred',
    code: 'INTERNAL_ERROR',
    statusCode: error.statusCode || 500,
    timestamp: new Date().toISOString()
  };
}

export function logError(error, context = {}) {
  const errorInfo = {
    message: error.message,
    stack: error.stack,
    context,
    timestamp: new Date().toISOString(),
    userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'Server',
    url: typeof window !== 'undefined' ? window.location.href : context.url || 'Server'
  };

  // Log to console in development
  if (process.env.NODE_ENV !== 'production') {
    console.group('🚨 Application Error');
    console.error('Error Info:', errorInfo);
    console.groupEnd();
  }

  // In production, send to error tracking service
  if (process.env.NODE_ENV === 'production') {
    // TODO: Implement error tracking service integration
    console.error('Production error:', errorInfo);
  }

  return errorInfo;
}

export function isClientError(error) {
  return error && error.code && (
    error.code.startsWith('MODULE_NOT_FOUND') ||
    error.code.startsWith('ERR_NETWORK') ||
    error.code.startsWith('CHUNK_LOAD_FAILED')
  );
}

export function isServerError(error) {
  return error && (
    error.statusCode >= 500 ||
    error.code?.startsWith('5') ||
    error.message?.includes('Internal Server Error')
  );
}

// Rate limiting error
export function createRateLimitError(resetTime) {
  return {
    error: 'Too many requests',
    code: 'RATE_LIMIT_EXCEEDED',
    statusCode: 429,
    resetTime,
    message: `Rate limit exceeded. Try again after ${new Date(resetTime).toLocaleString()}`
  };
}

// Validation error helper
export function createValidationError(field, message) {
  return {
    error: `Validation failed for ${field}: ${message}`,
    code: 'VALIDATION_ERROR',
    statusCode: 400,
    field,
    details: message
  };
}

// Multiple validation errors
export function createValidationErrors(errors) {
  return {
    error: 'Validation failed',
    code: 'VALIDATION_ERROR',
    statusCode: 400,
    errors: errors.map(err => ({
      field: err.field,
      message: err.message,
      code: err.code || 'INVALID_VALUE'
    }))
  };
}
