// src/controllers/userController.js
import userService from '../services/user.service.js';
import { sanitizeUser } from '../utils/helpers.js';
import { NotFoundError, ValidationError, ForbiddenError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';
import prisma from '../lib/prisma.js';
import { comparePassword, hashPassword } from '../lib/auth.js';

// ============================================================
// GET USER PROFILE
// ============================================================

export const getUserProfile = async (req, res, next) => {
  try {
    const userId = req.params.id ? parseInt(req.params.id) : req.user?.id;

    if (!userId) {
      throw new ValidationError('User ID is required');
    }

    // Traveller can only access their own profile, Admin can access any
    if (req.user.role?.name === 'TRAVELLER' && req.user.id !== userId) {
      throw new ForbiddenError('You can only access your own profile');
    }

    const user = await userService.getUserById(userId);

    res.status(200).json({
      success: true,
      user: sanitizeUser(user),
    });
  } catch (err) {
    logger.error('Failed to get user profile', err.message);
    next(err);
  }
};

// ============================================================
// UPDATE USER PROFILE
// ============================================================

export const updateUserProfile = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    const { bio, location, website, dateOfBirth, phone, firstName, lastName } = req.body;

    if (!userId) {
      throw new ValidationError('User ID is required');
    }

    // Update user basic info
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(phone && { phone }),
        ...(firstName && { firstName }),
        ...(lastName && { lastName }),
      },
      include: { role: true, profile: true },
    });

    // Update user profile
    if (bio || location || website || dateOfBirth) {
      await userService.updateUserProfile(userId, {
        bio,
        location,
        website,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
      });
    }

    logger.info(`User profile updated: ${userId}`);

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user: sanitizeUser(updatedUser),
    });
  } catch (err) {
    logger.error('Failed to update user profile', err.message);
    next(err);
  }
};

// ============================================================
// UPDATE USER AVATAR
// ============================================================

export const updateAvatar = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    const { avatar } = req.body;

    if (!userId) {
      throw new ValidationError('User ID is required');
    }

    if (!avatar) {
      throw new ValidationError('Avatar URL is required');
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { avatar },
      include: { role: true },
    });

    logger.info(`User avatar updated: ${userId}`);

    res.status(200).json({
      success: true,
      message: 'Avatar updated successfully',
      user: sanitizeUser(updatedUser),
    });
  } catch (err) {
    logger.error('Failed to update avatar', err.message);
    next(err);
  }
};

// ============================================================
// CHANGE PASSWORD
// ============================================================

export const changePassword = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    const { currentPassword, newPassword } = req.body;

    if (!userId) {
      throw new ValidationError('User ID is required');
    }

    const user = await userService.getUserById(userId);

    // Verify current password
    const isMatch = await comparePassword(currentPassword, user.password);

    if (!isMatch) {
      throw new ValidationError('Current password is incorrect');
    }

    // Hash new password and update
    const hashedPassword = await hashPassword(newPassword);

    await prisma.user.update({
      where: { id: userId },
      data: {
        password: hashedPassword,
        refreshToken: null,
        tokenVersion: { increment: 1 },
      },
    });

    logger.info(`Password changed for user: ${userId}`);

    res.status(200).json({
      success: true,
      message: 'Password changed successfully. Please login again.',
    });
  } catch (err) {
    logger.error('Failed to change password', err.message);
    next(err);
  }
};

// ============================================================
// DELETE ACCOUNT
// ============================================================

export const deleteAccount = async (req, res, next) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      throw new ValidationError('User ID is required');
    }

    await userService.deleteUserAccount(userId);

    res.clearCookie('access_token');
    res.clearCookie('refresh_token');

    logger.info(`User account deleted: ${userId}`);

    res.status(200).json({
      success: true,
      message: 'Account deleted successfully',
    });
  } catch (err) {
    logger.error('Failed to delete account', err.message);
    next(err);
  }
};