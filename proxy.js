import { NextResponse } from 'next/server';
// Security utilities are now handled by internal functions to ensure compatibility with Edge Runtime


// Store rate limit data in memory (in production, use Redis)
const rateLimitStore = new Map();

// Simple in-memory rate limiting for Next.js middleware
const createMemoryRateLimit = (options = {}) => {
  const windowMs = options.windowMs || 15 * 60 * 1000;
  const max = options.max || 100;

  return (req) => {
    const ip = req.ip || req.headers['x-forwarded-for'] || 'unknown';
    const now = Date.now();
    const windowStart = now - windowMs;

    if (!rateLimitStore.has(ip)) {
      rateLimitStore.set(ip, { count: 1, resetTime: now + windowMs });
      return { success: true };
    }

    const data = rateLimitStore.get(ip);

    if (now > data.resetTime) {
      data.count = 1;
      data.resetTime = now + windowMs;
      return { success: true };
    }

    if (data.count >= max) {
      return {
        success: false,
        resetTime: data.resetTime,
        message: options.message || 'Too many requests'
      };
    }

    data.count++;
    return { success: true };
  };
};

const apiLimiter = createMemoryRateLimit({ max: 1000 });
const loginLimiter = createMemoryRateLimit({ max: 5, windowMs: 15 * 60 * 1000 });

// Security headers
const addSecurityHeaders = (response) => {
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');

  // Content Security Policy
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https:",
    "connect-src 'self' https://api.supabase.co wss://api.supabase.co",
    "frame-src 'none'",
    "object-src 'none'",
    "media-src 'self'",
    "manifest-src 'self'",
  ].join('; ');

  response.headers.set('Content-Security-Policy', csp);

  return response;
};

// CORS handling
const addCORSHeaders = (response, origin) => {
  const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',')
    : ['http://localhost:3000', 'https://yourdomain.com'];

  if (allowedOrigins.includes(origin) || !origin) {
    response.headers.set('Access-Control-Allow-Origin', origin || '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    response.headers.set('Access-Control-Allow-Credentials', 'true');
  }

  return response;
};

// IP validation
const isValidIP = (ip) => {
  if (!ip) return false;

  // Basic IPv4 validation
  const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
  if (ipv4Regex.test(ip)) {
    return ip.split('.').every(octet => parseInt(octet) >= 0 && parseInt(octet) <= 255);
  }

  // Basic IPv6 validation (simplified)
  const ipv6Regex = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
  return ipv6Regex.test(ip);
};

// Main proxy function
export function proxy(request) {
  const response = NextResponse.next();

  // Get client IP
  const ip = request.ip ||
    request.headers.get('x-forwarded-for')?.split(',')[0] ||
    request.headers.get('x-real-ip') ||
    'unknown';

  // Get origin
  const origin = request.headers.get('origin');

  // Add security headers
  addSecurityHeaders(response);

  // Add CORS headers
  addCORSHeaders(response, origin);

  // Handle preflight requests
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: response.headers
    });
  }

  // Skip rate limiting for static assets and health checks
  if (request.nextUrl.pathname.startsWith('/_next/') ||
    request.nextUrl.pathname.startsWith('/api/health') ||
    request.nextUrl.pathname.startsWith('/static/')) {
    return response;
  }

  // Apply rate limiting based on route
  if (request.nextUrl.pathname.startsWith('/api/auth/login') ||
    request.nextUrl.pathname.startsWith('/api/auth/register') ||
    request.nextUrl.pathname.startsWith('/api/auth/reset-password')) {

    const limitResult = loginLimiter(request);
    if (!limitResult.success) {
      return new Response(
        JSON.stringify({
          error: limitResult.message,
          resetTime: limitResult.resetTime
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'X-RateLimit-Limit': '5',
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': limitResult.resetTime.toString(),
            'Retry-After': Math.ceil((limitResult.resetTime - Date.now()) / 1000).toString(),
          }
        }
      );
    }
  } else if (request.nextUrl.pathname.startsWith('/api/')) {
    const limitResult = apiLimiter(request);
    if (!limitResult.success) {
      return new Response(
        JSON.stringify({
          error: limitResult.message,
          resetTime: limitResult.resetTime
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'X-RateLimit-Limit': '1000',
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': limitResult.resetTime.toString(),
            'Retry-After': Math.ceil((limitResult.resetTime - Date.now()) / 1000).toString(),
          }
        }
      );
    }
  }

  // Log suspicious activity
  if (request.nextUrl.pathname.includes('..') ||
    request.nextUrl.pathname.includes('<') ||
    request.nextUrl.pathname.includes('>') ||
    request.nextUrl.pathname.includes('script')) {
    console.warn('Suspicious request detected:', {
      ip,
      userAgent: request.headers.get('user-agent'),
      path: request.nextUrl.pathname,
      timestamp: new Date().toISOString(),
    });
  }

  return response;
}

// Configure which paths the proxy should run on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
};
