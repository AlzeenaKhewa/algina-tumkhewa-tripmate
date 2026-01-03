// src/lib/validation.js
/**
 * Input validation utilities
 */

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean}
 */
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate password strength
 * Requirements: min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char
 * @param {string} password - Password to validate
 * @returns {boolean}
 */
export const isStrongPassword = (password) => {
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  return passwordRegex.test(password);
};

/**
 * Validate phone number (international format)
 * @param {string} phone - Phone number
 * @returns {boolean}
 */
export const isValidPhone = (phone) => {
  const phoneRegex = /^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/;
  return phoneRegex.test(phone);
};

/**
 * Validate username (alphanumeric, underscore, hyphen)
 * @param {string} username - Username
 * @returns {boolean}
 */
export const isValidUsername = (username) => {
  const usernameRegex = /^[a-zA-Z0-9_-]{3,20}$/;
  return usernameRegex.test(username);
};

/**
 * Validate OTP (6 digits)
 * @param {string|number} otp - OTP code
 * @returns {boolean}
 */
export const isValidOTP = (otp) => {
  if (!otp) return false;
  const otpString = String(otp).trim();
  return /^\d{6}$/.test(otpString);
};

/**
 * Sanitize email (convert to lowercase, trim)
 * @param {string} email - Email to sanitize
 * @returns {string}
 */
export const sanitizeEmail = (email) => {
  return email.toLowerCase().trim();
};

/**
 * Sanitize input string (trim whitespace)
 * @param {string} input - Input to sanitize
 * @returns {string}
 */
export const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  return input.trim();
};
