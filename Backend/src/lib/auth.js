// src/lib/auth.js
import jwt from 'jsonwebtoken';
import bcryptjs from 'bcryptjs';
import crypto from 'crypto';

// ============================================================
// PASSWORD HASHING
// ============================================================

/**
 * Hash password with bcryptjs
 * @param {string} password - Plain text password
 * @returns {Promise<string>} - Hashed password
 */
export const hashPassword = async (password) => {
  const salt = await bcryptjs.genSalt(10);
  return bcryptjs.hash(password, salt);
};

/**
 * Compare plain password with hashed password
 * @param {string} password - Plain text password
 * @param {string} hash - Hashed password from database
 * @returns {Promise<boolean>} - True if passwords match
 */
export const comparePassword = async (password, hash) => {
  return bcryptjs.compare(password, hash);
};

// ============================================================
// JWT TOKEN GENERATION
// ============================================================

/**
 * Generate Access Token (short-lived)
 * @param {object} payload - Token payload
 * @returns {string} - JWT token
 */
export const generateAccessToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_ACCESS_SECRET, {
    expiresIn: process.env.JWT_ACCESS_EXPIRE || '15m',
  });
};

/**
 * Generate Refresh Token (long-lived)
 * @param {object} payload - Token payload
 * @returns {string} - JWT token
 */
export const generateRefreshToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRE || '7d',
  });
};

/**
 * Verify and decode token
 * @param {string} token - JWT token
 * @param {string} secret - JWT secret
 * @returns {object} - Decoded payload or null if invalid
 */
export const verifyToken = (token, secret) => {
  try {
    return jwt.verify(token, secret);
  } catch (error) {
    return null;
  }
};

// ============================================================
// OTP GENERATION & HASHING
// ============================================================

/**
 * Generate OTP (One-Time Password)
 * @param {number} length - OTP length (default: 6)
 * @returns {string} - OTP
 */
export const generateOTP = (length = 6) => {
  const digits = '0123456789';
  let otp = '';
  for (let i = 0; i < length; i++) {
    otp += digits.charAt(Math.floor(Math.random() * 10));
  }
  return otp;
};

/**
 * Hash OTP using SHA-256 for secure storage
 * @param {string} otp - Plain OTP
 * @returns {string} - Hashed OTP
 */
export const hashToken = (otp) => {
  return crypto.createHash('sha256').update(otp).digest('hex');
};

/**
 * Verify OTP by comparing hashes
 * @param {string} plainOTP - Plain OTP from user
 * @param {string} hashedOTP - Hashed OTP from database
 * @returns {boolean} - True if OTP is valid
 */
export const verifyOTP = (plainOTP, hashedOTP) => {
  return hashToken(plainOTP) === hashedOTP;
};

// ============================================================
// PASSWORD RESET TOKEN
// ============================================================

/**
 * Generate password reset token
 * @returns {string} - Secure random token
 */
export const generatePasswordResetToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

/**
 * Hash password reset token for database storage
 * @param {string} token - Plain token
 * @returns {string} - Hashed token
 */
export const hashPasswordResetToken = (token) => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

// ============================================================
// SESSION TOKEN VERSIONING
// ============================================================

/**
 * Create a token version for session invalidation
 * Incrementing this forces old tokens to expire
 * @returns {number} - Current timestamp as version
 */
export const createTokenVersion = () => {
  return Math.floor(Date.now() / 1000);
};
