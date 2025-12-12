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
import { validatePostInput } from '../middleware/validation.js';

const router = express.Router();

// Public routes
router.get('/', getAllPosts);
router.get('/:id', getPostById);

// User posts
router.get('/user/:userId', getUserPosts);

// Protected routes (add authentication middleware in production)
router.post('/user/:userId', validatePostInput, createPost);
router.put('/:id', validatePostInput, updatePost);
router.delete('/:id', deletePost);

export default router;
