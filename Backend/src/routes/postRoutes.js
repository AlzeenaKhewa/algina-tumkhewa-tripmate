// src/routes/postRoutes.js
import express from 'express';
import {
  createPost,
  getAllPosts,
  getPostById,
  updatePost,
  deletePost,
  getUserPosts,
} from '../controllers/postController.js';
import { authenticate, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// ============================================================
// PUBLIC ROUTES (No Authentication Required)
// ============================================================

// Get all published posts
router.get('/', getAllPosts);

// Get post by ID (both published and private if user is author/admin)
router.get('/:id', getPostById);

// Get user's posts (public posts visible to all)
router.get('/user/:userId', getUserPosts);

// ============================================================
// PROTECTED ROUTES (Authentication Required)
// ============================================================

// Create post (authenticated users)
router.post('/', authenticate, createPost);

// Update post (only author or admin)
router.put('/:id', authenticate, updatePost);

// Delete post (only author or admin)
router.delete('/:id', authenticate, deletePost);

export default router;
