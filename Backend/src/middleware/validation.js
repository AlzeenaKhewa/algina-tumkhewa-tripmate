// src/middleware/validation.js
import {
  isValidEmail,
  isStrongPassword,
  isValidOTP,
  sanitizeEmail,
  sanitizeInput,
} from '../lib/validation.js';
import { ValidationError } from '../utils/errors.js';
import { API_MESSAGES } from '../utils/constants.js';

/**
 * Validate Registration Request
 */
export const validateRegister = (req, res, next) => {
  try {
    const { email, password, firstName, lastName } = req.body;

    // Email validation
    if (!email || !isValidEmail(email)) {
      throw new ValidationError(API_MESSAGES.INVALID_EMAIL);
    }

    // Password validation
    if (!password || !isStrongPassword(password)) {
      throw new ValidationError(API_MESSAGES.WEAK_PASSWORD);
    }

    // First name validation
    if (!firstName || typeof firstName !== 'string' || firstName.trim().length === 0) {
      throw new ValidationError('First name is required and must be a valid string.');
    }

    // Last name validation
    if (!lastName || typeof lastName !== 'string' || lastName.trim().length === 0) {
      throw new ValidationError('Last name is required and must be a valid string.');
    }

    // Sanitize inputs
    req.body.email = sanitizeEmail(email);
    req.body.firstName = sanitizeInput(firstName);
    req.body.lastName = sanitizeInput(lastName);

    next();
  } catch (err) {
    next(err);
  }
};

/**
 * Validate Email OTP Verification
 */
export const validateVerifyEmailOTP = (req, res, next) => {
  try {
    const { email, otp, otpCode, code } = req.body;

    console.log('🔍 DEBUG Full Request Body:', req.body);

    if (!email || !isValidEmail(email)) {
      throw new ValidationError(API_MESSAGES.INVALID_EMAIL);
    }

    // Accept multiple field names for OTP
    const otpValue = otp || otpCode || code;
    console.log('🔍 OTP Value (checking multiple fields):', { otp, otpCode, code, otpValue });

    // Convert OTP to string and validate
    const otpString = String(otpValue).trim();
    console.log('🔍 After trim:', { otpString, otpStringLength: otpString.length });

    // Check if OTP is exactly 6 digits
    const isValidOTPFormat = /^\d{6}$/.test(otpString);
    console.log('🔍 Regex test result:', { isValidOTPFormat });

    if (!otpValue || !isValidOTPFormat) {
      throw new ValidationError('OTP must be a 6-digit code. Expected field: "otp" or "otpCode" or "code"');
    }

    req.body.email = sanitizeEmail(email);
    req.body.otp = otpString; // Store as string with standard name

    next();
  } catch (err) {
    next(err);
  }
};

/**
 * Validate Login Request
 */
export const validateLogin = (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !isValidEmail(email)) {
      throw new ValidationError(API_MESSAGES.INVALID_EMAIL);
    }

    if (!password || typeof password !== 'string' || password.length === 0) {
      throw new ValidationError('Password is required.');
    }

    req.body.email = sanitizeEmail(email);

    next();
  } catch (err) {
    next(err);
  }
};

/**
 * Validate Password Reset Request
 */
export const validatePasswordResetRequest = (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email || !isValidEmail(email)) {
      throw new ValidationError(API_MESSAGES.INVALID_EMAIL);
    }

    req.body.email = sanitizeEmail(email);

    next();
  } catch (err) {
    next(err);
  }
};

/**
 * Validate Password Reset
 */
export const validatePasswordReset = (req, res, next) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !isValidEmail(email)) {
      throw new ValidationError(API_MESSAGES.INVALID_EMAIL);
    }

    if (!otp || !isValidOTP(otp)) {
      throw new ValidationError('OTP must be a 6-digit code.');
    }

    if (!newPassword || !isStrongPassword(newPassword)) {
      throw new ValidationError(API_MESSAGES.WEAK_PASSWORD);
    }

    req.body.email = sanitizeEmail(email);

    next();
  } catch (err) {
    next(err);
  }
};

/**
 * Validate OTP Resend Request
 */
export const validateResendOTP = (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email || !isValidEmail(email)) {
      throw new ValidationError(API_MESSAGES.INVALID_EMAIL);
    }

    req.body.email = sanitizeEmail(email);

    next();
  } catch (err) {
    next(err);
  }
};

/**
 * Validate Change Password Request
 */
export const validateChangePassword = (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || typeof currentPassword !== 'string' || currentPassword.length === 0) {
      throw new ValidationError('Current password is required.');
    }

    if (!newPassword || !isStrongPassword(newPassword)) {
      throw new ValidationError(API_MESSAGES.WEAK_PASSWORD);
    }

    next();
  } catch (err) {
    next(err);
  }
};

/**
 * Validate Post Input
 */
export const validatePostInput = (req, res, next) => {
  try {
    const { title, content } = req.body;

    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      throw new ValidationError('Title is required and must be a non-empty string.');
    }

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      throw new ValidationError('Content is required and must be a non-empty string.');
    }

    // Sanitize inputs
    req.body.title = sanitizeInput(title);
    req.body.content = sanitizeInput(content);

    next();
  } catch (err) {
    next(err);
  }
};

/**
 * Validate Profile Update
 */
export const validateProfileUpdate = (req, res, next) => {
  try {
    const { firstName, lastName, phone, bio, location, website } = req.body;

    if (firstName && (typeof firstName !== 'string' || firstName.trim().length === 0)) {
      throw new ValidationError('First name must be a non-empty string.');
    }

    if (lastName && (typeof lastName !== 'string' || lastName.trim().length === 0)) {
      throw new ValidationError('Last name must be a non-empty string.');
    }

    if (phone && typeof phone !== 'string') {
      throw new ValidationError('Phone must be a string.');
    }

    if (bio && typeof bio !== 'string') {
      throw new ValidationError('Bio must be a string.');
    }

    if (location && typeof location !== 'string') {
      throw new ValidationError('Location must be a string.');
    }

    if (website && typeof website !== 'string') {
      throw new ValidationError('Website must be a string.');
    }

    // Sanitize inputs
    if (firstName) req.body.firstName = sanitizeInput(firstName);
    if (lastName) req.body.lastName = sanitizeInput(lastName);
    if (phone) req.body.phone = sanitizeInput(phone);
    if (bio) req.body.bio = sanitizeInput(bio);
    if (location) req.body.location = sanitizeInput(location);
    if (website) req.body.website = sanitizeInput(website);

    next();
  } catch (err) {
    next(err);
  }
};

