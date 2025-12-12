import { Router } from 'express';
import { 
  createUser, 
  getAllUsers, 
  getUserById, 
  updateUser, 
  deleteUser, 
  loginUser, 
  changePassword 
} from '../controllers/userController.js';
import { validateUserInput } from '../middleware/validation.js';

const router = Router();

/**
 * ============================================================
 * PUBLIC ROUTES (No Authentication Required)
 * ============================================================
 */

/**
 * @route   POST /api/users/register
 * @desc    Register a new user
 * @access  Public
 * @body    {email, password, firstName, lastName}
 * @returns {success, message, data}
 */
router.post('/register', validateUserInput, createUser);

/**
 * @route   POST /api/users/login
 * @desc    Login user and get JWT token
 * @access  Public
 * @body    {email, password}
 * @returns {success, message, token, data}
 */
router.post('/login', validateUserInput, loginUser);

/**
 * ============================================================
 * PROTECTED ROUTES (Authentication Required)
 * TODO: Add authentication middleware before these routes
 * ============================================================
 */

/**
 * @route   GET /api/users
 * @desc    Get all users with pagination and search
 * @access  Protected
 * @query   {page, limit, search}
 * @returns {success, data, pagination}
 */
router.get('/', getAllUsers);

/**
 * @route   GET /api/users/:id
 * @desc    Get single user with profile and posts
 * @access  Protected
 * @params  {id}
 * @returns {success, data}
 */
router.get('/:id', getUserById);

/**
 * @route   PUT /api/users/:id
 * @desc    Update user information
 * @access  Protected (Owner or Admin)
 * @params  {id}
 * @body    {firstName, lastName, phone, avatar}
 * @returns {success, message, data}
 */
router.put('/:id', updateUser);

/**
 * @route   DELETE /api/users/:id
 * @desc    Delete user
 * @access  Protected (Owner or Admin)
 * @params  {id}
 * @returns {success, message}
 */
router.delete('/:id', deleteUser);

/**
 * @route   PUT /api/users/:id/change-password
 * @desc    Change user password
 * @access  Protected (Owner)
 * @params  {id}
 * @body    {currentPassword, newPassword}
 * @returns {success, message}
 */
router.put('/:id/change-password', changePassword);

export default router;
