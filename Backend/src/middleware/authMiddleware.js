import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma.js';
import { AuthenticationError, ForbiddenError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';

/**
 * Authenticate user via JWT access token
 * Verifies token, fetches user, checks account status, and validates token version
 */
export const authenticate = async (req, res, next) => {
  try {
    // 1. Extract Token from cookies or authorization header
    const token =
      req.cookies?.access_token ||
      (req.headers.authorization && req.headers.authorization.split(' ')[1]);

    if (!token) {
      throw new AuthenticationError('No access token provided');
    }

    // 2. Verify Token Signature
    let payload;
    try {
      payload = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        throw new AuthenticationError('Token has expired');
      }
      throw new AuthenticationError('Invalid or expired token');
    }

    // 3. Fetch User with Role
    const user = await prisma.user.findUnique({
      where: { id: Number(payload.userId) },
      include: { role: true },
    });

    if (!user) {
      throw new AuthenticationError('User not found');
    }

    // 4. Check Account Status
    if (!user.isActive) {
      res.clearCookie('access_token');
      res.clearCookie('refresh_token');
      throw new ForbiddenError('Account is blocked. Please contact support.');
    }

    // 5. Token Version Validation (Force Logout Check)
    // If tokenVersion doesn't match, all old tokens are invalidated
    if (payload.version !== undefined && payload.version !== user.tokenVersion) {
      throw new AuthenticationError('Session revoked. Please login again.');
    }

    // 6. Attach user to request object
    req.user = user;
    next();
  } catch (err) {
    logger.error('Authentication failed', err.message);
    next(err);
  }
};

/**
 * Authorization middleware - check user roles
 * @param {Array<string>} allowedRoles - Array of role names that are allowed
 */
export const authorize = (allowedRoles = []) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        throw new AuthenticationError('Authentication required');
      }

      const userRoleName = req.user.role?.name;

      if (!userRoleName || !allowedRoles.includes(userRoleName)) {
        throw new ForbiddenError('Insufficient permissions for this action');
      }

      next();
    } catch (err) {
      logger.error('Authorization failed', err.message);
      next(err);
    }
  };
};

/**
 * Middleware for admin-only routes
 */
export const isAdmin = (req, res, next) => {
  try {
    if (!req.user) {
      throw new AuthenticationError('Authentication required');
    }

    if (req.user.role?.name !== 'ADMIN') {
      throw new ForbiddenError('Admin access required');
    }

    next();
  } catch (err) {
    logger.error('Admin authorization failed', err.message);
    next(err);
  }
};

/**
 * Middleware for traveller-only routes
 */
export const isTraveller = (req, res, next) => {
  try {
    if (!req.user) {
      throw new AuthenticationError('Authentication required');
    }

    if (req.user.role?.name !== 'TRAVELLER') {
      throw new ForbiddenError('Traveller access required');
    }

    next();
  } catch (err) {
    logger.error('Traveller authorization failed', err.message);
    next(err);
  }
};

/**
 * Optional middleware for routes that should be accessible only to unauthenticated users
 */
export const isUnauthenticated = (req, res, next) => {
  if (req.user) {
    throw new ForbiddenError('You are already authenticated');
  }
  next();
};
