// src/controllers/postController.js
import prisma from '../lib/prisma.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { ForbiddenError, NotFoundError, ValidationError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';

// ============================================================
// CREATE POST
// ============================================================

export const createPost = asyncHandler(async (req, res) => {
  const { title, content, excerpt, published } = req.body;
  const userId = req.user?.id;

  if (!userId) {
    throw new ValidationError('User ID is required');
  }

  if (!title || !content) {
    throw new ValidationError('Title and content are required');
  }

  const post = await prisma.post.create({
    data: {
      title,
      content,
      excerpt: excerpt || null,
      published: published || false,
      authorId: userId,
    },
    include: {
      author: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          avatar: true,
          role: true,
        },
      },
    },
  });

  logger.info(`Post created by user ${userId}: ${post.id}`);

  res.status(201).json({
    success: true,
    message: 'Post created successfully',
    data: post,
  });
});

// ============================================================
// GET ALL POSTS
// ============================================================

export const getAllPosts = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, published } = req.query;
  const skip = (page - 1) * limit;

  const whereClause = {};
  
  // Only show published posts to non-authenticated or non-authors
  if (!req.user || req.user.role?.name === 'TRAVELLER') {
    whereClause.published = true;
  }

  const [posts, total] = await Promise.all([
    prisma.post.findMany({
      where: whereClause,
      include: {
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatar: true,
            role: true,
          },
        },
        _count: {
          select: { comments: true },
        },
      },
      skip: parseInt(skip),
      take: parseInt(limit),
      orderBy: {
        createdAt: 'desc',
      },
    }),
    prisma.post.count({ where: whereClause }),
  ]);

  res.status(200).json({
    success: true,
    data: posts,
    pagination: {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil(total / limit),
    },
  });
});

// ============================================================
// GET POST BY ID
// ============================================================

export const getPostById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const post = await prisma.post.findUnique({
    where: { id: parseInt(id) },
    include: {
      author: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          avatar: true,
          role: true,
        },
      },
      comments: {
        include: {
          author: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatar: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      },
      _count: {
        select: { comments: true },
      },
    },
  });

  if (!post) {
    throw new NotFoundError('Post not found');
  }

  // Check if user can view this post
  if (!post.published && (!req.user || req.user.id !== post.authorId)) {
    if (req.user?.role?.name !== 'ADMIN') {
      throw new ForbiddenError('You cannot access this post');
    }
  }

  res.status(200).json({
    success: true,
    data: post,
  });
});

// ============================================================
// UPDATE POST
// ============================================================

export const updatePost = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { title, content, excerpt, published } = req.body;
  const userId = req.user?.id;

  if (!userId) {
    throw new ValidationError('User ID is required');
  }

  // Fetch post to verify ownership
  const post = await prisma.post.findUnique({
    where: { id: parseInt(id) },
  });

  if (!post) {
    throw new NotFoundError('Post not found');
  }

  // Check authorization: only author or admin can update
  if (post.authorId !== userId && req.user?.role?.name !== 'ADMIN') {
    throw new ForbiddenError('You can only update your own posts');
  }

  const updatedPost = await prisma.post.update({
    where: { id: parseInt(id) },
    data: {
      ...(title && { title }),
      ...(content && { content }),
      ...(excerpt !== undefined && { excerpt }),
      ...(published !== undefined && { published }),
    },
    include: {
      author: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          avatar: true,
          role: true,
        },
      },
    },
  });

  logger.info(`Post updated by user ${userId}: ${updatedPost.id}`);

  res.status(200).json({
    success: true,
    message: 'Post updated successfully',
    data: updatedPost,
  });
});

// ============================================================
// DELETE POST
// ============================================================

export const deletePost = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user?.id;

  if (!userId) {
    throw new ValidationError('User ID is required');
  }

  // Fetch post to verify ownership
  const post = await prisma.post.findUnique({
    where: { id: parseInt(id) },
  });

  if (!post) {
    throw new NotFoundError('Post not found');
  }

  // Check authorization: only author or admin can delete
  if (post.authorId !== userId && req.user?.role?.name !== 'ADMIN') {
    throw new ForbiddenError('You can only delete your own posts');
  }

  await prisma.post.delete({
    where: { id: parseInt(id) },
  });

  logger.info(`Post deleted by user ${userId}: ${id}`);

  res.status(200).json({
    success: true,
    message: 'Post deleted successfully',
  });
});

// ============================================================
// GET USER POSTS
// ============================================================

export const getUserPosts = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { page = 1, limit = 10 } = req.query;
  const skip = (page - 1) * limit;

  // Check if user can view these posts
  if (req.user?.role?.name === 'TRAVELLER' && req.user.id !== parseInt(userId)) {
    // Travellers can only see published posts from others
    const whereClause = { authorId: parseInt(userId), published: true };

    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        where: whereClause,
        include: {
          author: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              avatar: true,
              role: true,
            },
          },
          _count: {
            select: { comments: true },
          },
        },
        skip: parseInt(skip),
        take: parseInt(limit),
        orderBy: {
          createdAt: 'desc',
        },
      }),
      prisma.post.count({ where: whereClause }),
    ]);

    return res.status(200).json({
      success: true,
      data: posts,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit),
      },
    });
  }

  // Own posts or admin view
  const [posts, total] = await Promise.all([
    prisma.post.findMany({
      where: { authorId: parseInt(userId) },
      include: {
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatar: true,
            role: true,
          },
        },
        _count: {
          select: { comments: true },
        },
      },
      skip: parseInt(skip),
      take: parseInt(limit),
      orderBy: {
        createdAt: 'desc',
      },
    }),
    prisma.post.count({ where: { authorId: parseInt(userId) } }),
  ]);

  res.status(200).json({
    success: true,
    data: posts,
    pagination: {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil(total / limit),
    },
  });
});
