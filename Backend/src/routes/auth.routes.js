// src/routes/auth.routes.js
import express from 'express';
import {
  register,
  verifyEmailOTP,
  login,
  refreshTokens,
  logout,
  requestPasswordReset,
  resetPassword,
  resendOTP,
  getCurrentUser,
  revokeAllSessions,
} from '../controllers/auth.controller.js';
import {
  validateRegister,
  validateVerifyEmailOTP,
  validateLogin,
  validatePasswordResetRequest,
  validatePasswordReset,
  validateResendOTP,
} from '../middleware/validation.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = express.Router();

// ============================================================
// PUBLIC ROUTES (No Authentication Required)
// ============================================================

// Registration
router.post('/register', validateRegister, register);

// Email Verification
router.post('/verify-email-otp', validateVerifyEmailOTP, verifyEmailOTP);

// Login
router.post('/login', validateLogin, login);

// Token Refresh
router.post('/refresh', refreshTokens);

// Password Recovery
router.post('/request-password-reset', validatePasswordResetRequest, requestPasswordReset);
router.post('/reset-password', validatePasswordReset, resetPassword);

// Resend OTP
router.post('/resend-otp', validateResendOTP, resendOTP);

// ============================================================
// PROTECTED ROUTES (Authentication Required)
// ============================================================

// Get Current User
router.get('/me', authenticate, getCurrentUser);

// Logout
router.post('/logout', authenticate, logout);

// Revoke All Sessions
router.post('/revoke-sessions', authenticate, revokeAllSessions);

export default router;
