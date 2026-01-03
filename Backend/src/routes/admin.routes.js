// src/routes/admin.routes.js
import express from 'express';
import { authenticate, isAdmin } from '../middleware/authMiddleware.js';
import userService from '../services/user.service.js';
import { sanitizeUser } from '../utils/helpers.js';
import { NotFoundError, ValidationError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';

const router = express.Router();

// ============================================================
// ADMIN ONLY ROUTES - User Management
// ============================================================

/**
 * GET /admin/users - Get all users (paginated)
 */
router.get('/users', authenticate, isAdmin, async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const { users, total } = await userService.getAllUsers(skip, parseInt(limit));

    res.status(200).json({
      success: true,
      data: users.map(sanitizeUser),
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    logger.error('Failed to fetch users', err.message);
    next(err);
  }
});

/**
 * GET /admin/users/:id - Get specific user details
 */
router.get('/users/:id', authenticate, isAdmin, async (req, res, next) => {
  try {
    const user = await userService.getUserById(parseInt(req.params.id));

    res.status(200).json({
      success: true,
      user: sanitizeUser(user),
    });
  } catch (err) {
    logger.error('Failed to fetch user', err.message);
    next(err);
  }
});

/**
 * POST /admin/users/:id/block - Block a user account
 */
router.post('/users/:id/block', authenticate, isAdmin, async (req, res, next) => {
  try {
    const userId = parseInt(req.params.id);

    if (userId === req.user?.id) {
      throw new ValidationError('You cannot block your own account');
    }

    const user = await userService.blockUser(userId);

    res.status(200).json({
      success: true,
      message: 'User account blocked successfully',
      user: sanitizeUser(user),
    });
  } catch (err) {
    logger.error('Failed to block user', err.message);
    next(err);
  }
});

/**
 * POST /admin/users/:id/unblock - Unblock a user account
 */
router.post('/users/:id/unblock', authenticate, isAdmin, async (req, res, next) => {
  try {
    const userId = parseInt(req.params.id);

    const user = await userService.unblockUser(userId);

    res.status(200).json({
      success: true,
      message: 'User account unblocked successfully',
      user: sanitizeUser(user),
    });
  } catch (err) {
    logger.error('Failed to unblock user', err.message);
    next(err);
  }
});

/**
 * DELETE /admin/users/:id - Delete a user account
 */
router.delete('/users/:id', authenticate, isAdmin, async (req, res, next) => {
  try {
    const userId = parseInt(req.params.id);

    if (userId === req.user?.id) {
      throw new ValidationError('You cannot delete your own account');
    }

    await userService.deleteUserAccount(userId);

    res.status(200).json({
      success: true,
      message: 'User account deleted successfully',
    });
  } catch (err) {
    logger.error('Failed to delete user', err.message);
    next(err);
  }
});

/**
 * GET /admin/stats - Get system statistics
 */
router.get('/stats', authenticate, isAdmin, async (req, res, next) => {
  try {
    const prisma = await import('../lib/prisma.js').then(m => m.default);

    const [totalUsers, adminCount, travellerCount, totalPosts] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: { name: 'ADMIN' } } }),
      prisma.user.count({ where: { role: { name: 'TRAVELLER' } } }),
      prisma.post.count(),
    ]);

    res.status(200).json({
      success: true,
      stats: {
        totalUsers,
        adminCount,
        travellerCount,
        totalPosts,
      },
    });
  } catch (err) {
    logger.error('Failed to fetch stats', err.message);
    next(err);
  }
});

export default router;
