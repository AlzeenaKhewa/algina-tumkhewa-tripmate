// src/utils/constants.js
/**
 * Application Constants
 */

// ============================================================
// HTTP STATUS CODES & MESSAGES
// ============================================================

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_SERVER_ERROR: 500,
  TOO_MANY_REQUESTS: 429,
};

export const API_MESSAGES = {
  // Authentication
  REGISTER_SUCCESS: 'Registration successful. OTP sent to your email.',
  EMAIL_VERIFIED: 'Email verified successfully.',
  LOGIN_SUCCESS: 'Login successful.',
  LOGOUT_SUCCESS: 'Logged out successfully.',
  TOKEN_REFRESHED: 'Token refreshed successfully.',
  PASSWORD_RESET_SENT: 'Password reset link sent to your email.',
  PASSWORD_RESET_SUCCESS: 'Password reset successful.',
  OTP_RESENT: 'OTP resent to your email.',

  // Errors
  INVALID_CREDENTIALS: 'Invalid email or password.',
  EMAIL_NOT_VERIFIED: 'Email not verified. Please verify your email first.',
  USER_NOT_FOUND: 'User not found.',
  EMAIL_ALREADY_REGISTERED: 'Email is already registered.',
  INVALID_OTP: 'Invalid OTP. Please try again.',
  OTP_EXPIRED: 'OTP has expired. Please request a new one.',
  TOKEN_EXPIRED: 'Token has expired. Please login again.',
  TOKEN_INVALID: 'Invalid token.',
  ACCOUNT_BLOCKED: 'Your account is blocked. Please contact support.',
  SESSION_REVOKED: 'Your session has been revoked. Please login again.',
  NO_TOKEN_PROVIDED: 'No access token provided.',
  INSUFFICIENT_PERMISSIONS: 'You do not have permission to perform this action.',
  INVALID_PASSWORD: 'Password does not meet security requirements.',
  WEAK_PASSWORD: 'Password must be at least 8 characters with uppercase, lowercase, number, and special character.',
  INVALID_EMAIL: 'Please provide a valid email address.',
  INVALID_PHONE: 'Please provide a valid phone number.',
};

// ============================================================
// TOKEN EXPIRY TIMES
// ============================================================

export const TOKEN_EXPIRY = {
  ACCESS_TOKEN: '15m', // 15 minutes
  REFRESH_TOKEN: '7d', // 7 days
  OTP: 15 * 60 * 1000, // 15 minutes in milliseconds
  PASSWORD_RESET_OTP: 30 * 60 * 1000, // 30 minutes in milliseconds
  SESSION: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
};

// ============================================================
// PASSWORD REQUIREMENTS
// ============================================================

export const PASSWORD_REQUIREMENTS = {
  MIN_LENGTH: 8,
  REQUIRE_UPPERCASE: true,
  REQUIRE_LOWERCASE: true,
  REQUIRE_NUMBERS: true,
  REQUIRE_SPECIAL_CHARS: true,
};

// ============================================================
// VALIDATION RULES
// ============================================================

export const VALIDATION_RULES = {
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PASSWORD_REGEX: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
  PHONE_REGEX: /^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/,
  USERNAME_REGEX: /^[a-zA-Z0-9_-]{3,20}$/,
  OTP_REGEX: /^\d{6}$/,
};

// ============================================================
// ROLE TYPES
// ============================================================

export const ROLES = {
  ADMIN: 'ADMIN',
  TRAVELLER: 'TRAVELLER',
};

// ============================================================
// USER STATUS
// ============================================================

export const USER_STATUS = {
  ACTIVE: true,
  BLOCKED: false,
};

// ============================================================
// PAGINATION DEFAULTS
// ============================================================

export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100,
};

// ============================================================
// COOKIE OPTIONS
// ============================================================

export const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  path: '/',
};

// ============================================================
// EMAIL CONFIGURATION
// ============================================================

export const EMAIL_CONFIG = {
  OTP_EXPIRE_MINUTES: 15,
  PASSWORD_RESET_EXPIRE_MINUTES: 30,
  FROM_NAME: 'Tripmate',
};

// ============================================================
// RATE LIMITING
// ============================================================

export const RATE_LIMITS = {
  LOGIN_ATTEMPTS: 5, // Max login attempts
  LOGIN_WINDOW: 15 * 60 * 1000, // 15 minutes
  OTP_REQUESTS: 3, // Max OTP requests
  OTP_WINDOW: 60 * 60 * 1000, // 1 hour
  API_REQUESTS: 100, // Max API requests per window
  API_WINDOW: 15 * 60 * 1000, // 15 minutes
};

// ============================================================
// AUDIT LOG ACTIONS
// ============================================================

export const AUDIT_ACTIONS = {
  REGISTER: 'REGISTER',
  VERIFY_EMAIL: 'VERIFY_EMAIL',
  LOGIN: 'LOGIN',
  LOGOUT: 'LOGOUT',
  REFRESH_TOKEN: 'REFRESH_TOKEN',
  REQUEST_PASSWORD_RESET: 'REQUEST_PASSWORD_RESET',
  RESET_PASSWORD: 'RESET_PASSWORD',
  UPDATE_PROFILE: 'UPDATE_PROFILE',
  DELETE_ACCOUNT: 'DELETE_ACCOUNT',
  CHANGE_EMAIL: 'CHANGE_EMAIL',
  CHANGE_PASSWORD: 'CHANGE_PASSWORD',
  ENABLE_2FA: 'ENABLE_2FA',
  DISABLE_2FA: 'DISABLE_2FA',
  RESEND_OTP: 'RESEND_OTP',
};
