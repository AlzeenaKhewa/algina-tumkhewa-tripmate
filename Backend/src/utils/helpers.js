// src/utils/helpers.js

/**
 * Format error response
 */
export const formatErrorResponse = (message, statusCode = 500) => {
  return {
    success: false,
    message,
    statusCode,
  };
};

/**
 * Format success response
 */
export const formatSuccessResponse = (data, message = 'Success', statusCode = 200) => {
  return {
    success: true,
    message,
    data,
    statusCode,
  };
};

/**
 * Validate email format
 */
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate strong password
 */
export const isStrongPassword = (password) => {
  // At least 8 characters, 1 uppercase, 1 lowercase, 1 number
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;
  return passwordRegex.test(password);
};

/**
 * Generate random token
 */
export const generateToken = (length = 32) => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  for (let i = 0; i < length; i++) {
    token += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return token;
};

/**
 * Paginate results
 */
export const paginate = (page = 1, limit = 10) => {
  return {
    skip: (parseInt(page) - 1) * parseInt(limit),
    take: parseInt(limit),
  };
};

/**
 * Calculate pagination info
 */
export const getPaginationInfo = (total, page, limit) => {
  return {
    total,
    page: parseInt(page),
    limit: parseInt(limit),
    pages: Math.ceil(total / limit),
  };
};
