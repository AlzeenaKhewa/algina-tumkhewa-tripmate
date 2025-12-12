// src/controllers/postController.js
import prisma from '../config/database.js';
import { asyncHandler } from '../middleware/errorHandler.js';

// ============================================================
// CREATE POST
// ============================================================
export const createPost = asyncHandler(async (req, res) => {
  const { title, content, excerpt, published } = req.body;
  const { userId } = req.params;

  const post = await prisma.post.create({
    data: {
      title,
      content,
      excerpt,
      published,
      authorId: parseInt(userId),
    },
    include: {
      author: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          avatar: true,
        },
      },
    },
  });

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

  const whereClause = published !== undefined 
    ? { published: published === 'true' } 
    : {};

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
    return res.status(404).json({
      success: false,
      message: 'Post not found',
    });
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

  const post = await prisma.post.update({
    where: { id: parseInt(id) },
    data: {
      title,
      content,
      excerpt,
      published,
    },
    include: {
      author: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          avatar: true,
        },
      },
    },
  });

  res.status(200).json({
    success: true,
    message: 'Post updated successfully',
    data: post,
  });
});

// ============================================================
// DELETE POST
// ============================================================
export const deletePost = asyncHandler(async (req, res) => {
  const { id } = req.params;

  await prisma.post.delete({
    where: { id: parseInt(id) },
  });

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
