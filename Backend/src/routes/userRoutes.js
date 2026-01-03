// src/routes/userRoutes.js
import express from 'express';
import {
  getUserProfile,
  updateUserProfile,
  updateAvatar,
  changePassword,
  deleteAccount,
} from '../controllers/userController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import {
  validateProfileUpdate,
  validateChangePassword,
} from '../middleware/validation.js';

const router = express.Router();

// ============================================================
// PROTECTED ROUTES (Authentication Required)
// ============================================================

// Get own profile
router.get('/profile', authenticate, getUserProfile);

// Get other user's profile (public but authenticated can view)
router.get('/:id', authenticate, getUserProfile);

// Update profile (own profile)
router.put('/profile', authenticate, validateProfileUpdate, updateUserProfile);

// Update avatar
router.put('/avatar', authenticate, updateAvatar);

// Change password
router.post('/change-password', authenticate, validateChangePassword, changePassword);

// Delete account (self-destructing)
router.delete('/account', authenticate, deleteAccount);

export default router;

