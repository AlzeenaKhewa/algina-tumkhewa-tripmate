// src/controllers/auth.controller.js
import userService from '../services/user.service.js';
import { generateAccessToken, generateRefreshToken } from '../lib/auth.js';
import {
  AuthenticationError,
  ValidationError,
  NotFoundError,
  ForbiddenError,
} from '../utils/errors.js';
import { logger } from '../utils/logger.js';
import { sanitizeUser } from '../utils/helpers.js';
import { API_MESSAGES, COOKIE_OPTIONS } from '../utils/constants.js';
import jwt from 'jsonwebtoken';

// ============================================================
// REGISTRATION
// ============================================================

export const register = async (req, res, next) => {
  try {
    const { email, password, firstName, lastName } = req.body;

    await userService.registerUser({ email, password, firstName, lastName });

    logger.info(`User registered: ${email}`);

    res.status(201).json({
      success: true,
      message: API_MESSAGES.REGISTER_SUCCESS,
    });
  } catch (err) {
    logger.error(`Registration failed for email: ${req.body.email}`, err.message);
    next(err);
  }
};

// ============================================================
// VERIFY EMAIL OTP
// ============================================================

export const verifyEmailOTP = async (req, res, next) => {
  try {
    const { email, otp } = req.body;

    const { user } = await userService.verifyEmailOTP({ email, otp });

    // Create token payload with version for session invalidation support
    const tokenPayload = {
      userId: user.id,
      role: user.role?.name || 'TRAVELLER',
      version: user.tokenVersion,
    };

    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    // Save refresh token to DB
    await userService.saveRefreshToken(user.id, refreshToken);

    // Set secure cookies
    res.cookie('access_token', accessToken, {
      ...COOKIE_OPTIONS,
      maxAge: 1000 * 60 * 15, // 15 minutes
    });
    res.cookie('refresh_token', refreshToken, {
      ...COOKIE_OPTIONS,
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
    });

    logger.info(`Email verified for user: ${email}`);

    res.status(200).json({
      success: true,
      message: API_MESSAGES.EMAIL_VERIFIED,
      user: sanitizeUser(user),
      accessToken,
    });
  } catch (err) {
    logger.error(`Email verification failed for: ${req.body.email}`, err.message);
    next(err);
  }
};

// ============================================================
// LOGIN
// ============================================================

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await userService.authenticateUser(email, password);

    // Check email verification
    if (!user.isVerified) {
      throw new AuthenticationError(API_MESSAGES.EMAIL_NOT_VERIFIED);
    }

    // Check account status
    if (!user.isActive) {
      throw new ForbiddenError(API_MESSAGES.ACCOUNT_BLOCKED);
    }

    const tokenPayload = {
      userId: user.id,
      role: user.role?.name || 'TRAVELLER',
      version: user.tokenVersion,
    };

    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    // Store refresh token in DB
    await userService.saveRefreshToken(user.id, refreshToken);

    // Set cookies
    res.cookie('access_token', accessToken, {
      ...COOKIE_OPTIONS,
      maxAge: 1000 * 60 * 15,
    });
    res.cookie('refresh_token', refreshToken, {
      ...COOKIE_OPTIONS,
      maxAge: 1000 * 60 * 60 * 24 * 7,
    });

    logger.info(`User logged in: ${email}`);

    res.status(200).json({
      success: true,
      message: API_MESSAGES.LOGIN_SUCCESS,
      user: sanitizeUser(user),
      accessToken,
    });
  } catch (err) {
    logger.error(`Login failed for email: ${req.body.email}`, err.message);
    next(err);
  }
};

// ============================================================
// REFRESH TOKENS
// ============================================================

export const refreshTokens = async (req, res, next) => {
  try {
    const refreshToken =
      req.cookies?.refresh_token ||
      (req.headers.authorization && req.headers.authorization.split(' ')[1]);

    if (!refreshToken) {
      throw new AuthenticationError('No refresh token provided');
    }

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const user = await userService.getUserWithRefreshToken(decoded.userId, refreshToken);

    const tokenPayload = {
      userId: user.id,
      role: user.role?.name || 'TRAVELLER',
      version: user.tokenVersion,
    };

    const newAccessToken = generateAccessToken(tokenPayload);
    const newRefreshToken = generateRefreshToken(tokenPayload);

    // Update refresh token in DB
    await userService.saveRefreshToken(user.id, newRefreshToken);

    res.cookie('access_token', newAccessToken, {
      ...COOKIE_OPTIONS,
      maxAge: 1000 * 60 * 15,
    });
    res.cookie('refresh_token', newRefreshToken, {
      ...COOKIE_OPTIONS,
      maxAge: 1000 * 60 * 60 * 24 * 7,
    });

    logger.info(`Tokens refreshed for user: ${user.id}`);

    res.status(200).json({
      success: true,
      message: API_MESSAGES.TOKEN_REFRESHED,
      accessToken: newAccessToken,
    });
  } catch (err) {
    logger.error('Token refresh failed', err.message);
    res.clearCookie('access_token');
    res.clearCookie('refresh_token');
    next(err);
  }
};

// ============================================================
// LOGOUT
// ============================================================

export const logout = async (req, res, next) => {
  try {
    const userId = req.user?.id;

    if (userId) {
      // Clear refresh token from DB
      await userService.clearRefreshToken(userId);
      logger.info(`User logged out: ${userId}`);
    }

    // Clear cookies
    res.clearCookie('access_token');
    res.clearCookie('refresh_token');

    res.status(200).json({
      success: true,
      message: API_MESSAGES.LOGOUT_SUCCESS,
    });
  } catch (err) {
    logger.error('Logout failed', err.message);
    next(err);
  }
};

// ============================================================
// PASSWORD RESET REQUEST
// ============================================================

export const requestPasswordReset = async (req, res, next) => {
  try {
    const { email } = req.body;

    await userService.createAndSendOTP(email, 'PASSWORD_RESET');

    logger.info(`Password reset OTP sent to: ${email}`);

    res.status(200).json({
      success: true,
      message: API_MESSAGES.PASSWORD_RESET_SENT,
    });
  } catch (err) {
    logger.error(`Password reset request failed for: ${req.body.email}`, err.message);
    next(err);
  }
};

// ============================================================
// RESET PASSWORD
// ============================================================

export const resetPassword = async (req, res, next) => {
  try {
    const { email, otp, newPassword } = req.body;

    await userService.resetPassword({ email, otp, newPassword });

    logger.info(`Password reset successful for: ${email}`);

    res.status(200).json({
      success: true,
      message: API_MESSAGES.PASSWORD_RESET_SUCCESS,
    });
  } catch (err) {
    logger.error(`Password reset failed for: ${req.body.email}`, err.message);
    next(err);
  }
};

// ============================================================
// RESEND OTP
// ============================================================

export const resendOTP = async (req, res, next) => {
  try {
    const { email, type = 'EMAIL_VERIFY' } = req.body;

    await userService.createAndSendOTP(email, type);

    logger.info(`OTP resent to: ${email}`);

    res.status(200).json({
      success: true,
      message: API_MESSAGES.OTP_RESENT,
    });
  } catch (err) {
    logger.error(`Resend OTP failed for: ${req.body.email}`, err.message);
    next(err);
  }
};

// ============================================================
// GET CURRENT USER
// ============================================================

export const getCurrentUser = async (req, res, next) => {
  try {
    const user = req.user;

    if (!user) {
      throw new AuthenticationError('Not authenticated');
    }

    res.status(200).json({
      success: true,
      user: sanitizeUser(user),
    });
  } catch (err) {
    logger.error('Failed to get current user', err.message);
    next(err);
  }
};

// ============================================================
// REVOKE ALL SESSIONS
// ============================================================

export const revokeAllSessions = async (req, res, next) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      throw new AuthenticationError('Not authenticated');
    }

    // Increment token version to invalidate all existing tokens
    await userService.revokeAllUserSessions(userId);

    res.clearCookie('access_token');
    res.clearCookie('refresh_token');

    logger.info(`All sessions revoked for user: ${userId}`);

    res.status(200).json({
      success: true,
      message: 'All sessions have been revoked. Please login again.',
    });
  } catch (err) {
    logger.error('Failed to revoke sessions', err.message);
    next(err);
  }
};
