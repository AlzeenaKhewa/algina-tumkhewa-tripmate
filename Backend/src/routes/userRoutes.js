// src/routes/userRoutes.js
import express from 'express';
import {
  createUser,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  loginUser,
  changePassword,
} from '../controllers/userController.js';
import { validateUserInput } from '../middleware/validation.js';

const router = express.Router();

// Public routes
router.post('/register', validateUserInput, createUser);
router.post('/login', validateUserInput, loginUser);

// Protected routes (add authentication middleware in production)
router.get('/', getAllUsers);
router.get('/:id', getUserById);
router.put('/:id', updateUser);
router.delete('/:id', deleteUser);
router.put('/:id/change-password', changePassword);

export default router;
