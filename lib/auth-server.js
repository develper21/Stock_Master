import { NextResponse } from 'next/server';
import { verifyToken, getUserById } from './auth-custom';

export async function getAuthUser(req) {
  try {
    // Get token from Authorization header or cookies
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '') || 
                 req.cookies.get('auth-token')?.value;

    if (!token) {
      return null;
    }

    // Verify token
    const decoded = verifyToken(token);
    if (!decoded) {
      return null;
    }

    // Get fresh user data from database
    const user = await getUserById(decoded.id);
    if (!user) {
      return null;
    }

    return user;
  } catch (error) {
    console.error('Auth error:', error);
    return null;
  }
}

export function setAuthCookie(res, token) {
  res.cookies.set('auth-token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60, // 7 days
    path: '/'
  });
}

export function clearAuthCookie(res) {
  res.cookies.set('auth-token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    path: '/'
  });
}

export function requireAuth(handler) {
  return async (req, ...args) => {
    const user = await getAuthUser(req);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' }, 
        { status: 401 }
      );
    }

    // Add user to request object
    req.user = user;
    
    return handler(req, ...args);
  };
}

export function requireRole(role) {
  return (handler) => {
    return requireAuth(async (req, ...args) => {
      if (req.user.role !== role) {
        return NextResponse.json(
          { error: 'Forbidden: Insufficient permissions' }, 
          { status: 403 }
        );
      }
      
      return handler(req, ...args);
    });
  };
}
