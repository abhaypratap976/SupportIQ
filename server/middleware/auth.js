import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';

const JWT_SECRET = process.env.JWT_SECRET || 'supportiq-development-jwt-secret-fallback-key-32chars';

/**
 * Middleware: Verify JWT and attach authenticated user to req.user
 */
export async function authenticate(req, res, next) {
  try {
    let token = null;

    // Check HttpOnly cookie
    if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    } else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      // Check Authorization Bearer header
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        error: 'Authentication required. Please sign in to access this resource.'
      });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        res.clearCookie('token');
        return res.status(401).json({
          error: 'Your session has expired. Please log in again.'
        });
      }
      return res.status(401).json({
        error: 'Invalid authentication credential.'
      });
    }

    const user = await User.findById(decoded.id);
    if (!user) {
      res.clearCookie('token');
      return res.status(401).json({
        error: 'User account not found or deactivated.'
      });
    }

    if (user.status === 'Suspended') {
      res.clearCookie('token');
      return res.status(403).json({
        error: 'This account has been suspended. Please contact your administrator.'
      });
    }

    req.user = user;
    next();
  } catch (err) {
    console.error('[Auth Middleware] Error:', err);
    return res.status(500).json({ error: 'Internal authentication error.' });
  }
}

/**
 * Middleware: Enforce role-based access control
 * @param {string[]} allowedRoles Array of roles (e.g. ['Admin'], ['Admin', 'Agent'])
 */
export function requireRole(allowedRoles = []) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required.' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: `Forbidden: Only ${allowedRoles.join(' or ')} can perform this action.`
      });
    }

    next();
  };
}

/**
 * Optional authentication middleware for public endpoints that behave differently if logged in
 */
export async function optionalAuth(req, res, next) {
  let token = null;
  if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  } else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      const user = await User.findById(decoded.id);
      if (user && user.status !== 'Suspended') {
        req.user = user;
      }
    } catch {
      // Ignore token errors for optional auth
    }
  }

  next();
}

/**
 * Sign JWT token for user
 */
export function signToken(user) {
  return jwt.sign(
    {
      id: user._id.toString(),
      email: user.email,
      role: user.role
    },
    JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

/**
 * Cookie options helper
 */
export function getCookieOptions() {
  const isProd = process.env.NODE_ENV === 'production';
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'strict' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  };
}
