// src/controllers/userController.js
import prisma from '../config/database.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { asyncHandler } from '../middleware/errorHandler.js';

// ============================================================
// CREATE USER
// ============================================================
export const createUser = asyncHandler(async (req, res) => {
  const { email, password, firstName, lastName, roleId = 2 } = req.body;

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    return res.status(409).json({
      success: false,
      message: 'User already exists',
    });
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10);

  // Create user
  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      firstName,
      lastName,
      roleId,
    },
    include: {
      role: true,
    },
  });

  // Remove password from response
  const { password: _, ...userWithoutPassword } = user;

  res.status(201).json({
    success: true,
    message: 'User created successfully',
    data: userWithoutPassword,
  });
});

// ============================================================
// GET ALL USERS
// ============================================================
export const getAllUsers = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, search } = req.query;
  const skip = (page - 1) * limit;

  const whereClause = search
    ? {
        OR: [
          { email: { contains: search, mode: 'insensitive' } },
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } },
        ],
      }
    : {};

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where: whereClause,
      include: {
        role: true,
      },
      skip: parseInt(skip),
      take: parseInt(limit),
      orderBy: {
        createdAt: 'desc',
      },
    }),
    prisma.user.count({ where: whereClause }),
  ]);

  // Remove passwords from response
  const usersWithoutPasswords = users.map(({ password: _, ...user }) => user);

  res.status(200).json({
    success: true,
    data: usersWithoutPasswords,
    pagination: {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil(total / limit),
    },
  });
});

// ============================================================
// GET USER BY ID
// ============================================================
export const getUserById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const user = await prisma.user.findUnique({
    where: { id: parseInt(id) },
    include: {
      role: true,
      profile: true,
      posts: {
        orderBy: { createdAt: 'desc' },
        take: 5,
      },
    },
  });

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found',
    });
  }

  const { password: _, ...userWithoutPassword } = user;

  res.status(200).json({
    success: true,
    data: userWithoutPassword,
  });
});

// ============================================================
// UPDATE USER
// ============================================================
export const updateUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { firstName, lastName, phone, avatar } = req.body;

  const user = await prisma.user.update({
    where: { id: parseInt(id) },
    data: {
      firstName,
      lastName,
      phone,
      avatar,
    },
    include: {
      role: true,
    },
  });

  const { password: _, ...userWithoutPassword } = user;

  res.status(200).json({
    success: true,
    message: 'User updated successfully',
    data: userWithoutPassword,
  });
});

// ============================================================
// DELETE USER
// ============================================================
export const deleteUser = asyncHandler(async (req, res) => {
  const { id } = req.params;

  await prisma.user.delete({
    where: { id: parseInt(id) },
  });

  res.status(200).json({
    success: true,
    message: 'User deleted successfully',
  });
});

// ============================================================
// LOGIN
// ============================================================
export const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await prisma.user.findUnique({
    where: { email },
    include: { role: true },
  });

  if (!user) {
    return res.status(401).json({
      success: false,
      message: 'Invalid credentials',
    });
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);

  if (!isPasswordValid) {
    return res.status(401).json({
      success: false,
      message: 'Invalid credentials',
    });
  }

  const token = jwt.sign(
    { id: user.id, email: user.email, roleId: user.roleId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE }
  );

  const { password: _, ...userWithoutPassword } = user;

  res.status(200).json({
    success: true,
    message: 'Login successful',
    token,
    data: userWithoutPassword,
  });
});

// ============================================================
// CHANGE PASSWORD
// ============================================================
export const changePassword = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { currentPassword, newPassword } = req.body;

  const user = await prisma.user.findUnique({
    where: { id: parseInt(id) },
  });

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found',
    });
  }

  const isPasswordValid = await bcrypt.compare(currentPassword, user.password);

  if (!isPasswordValid) {
    return res.status(401).json({
      success: false,
      message: 'Current password is incorrect',
    });
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);

  await prisma.user.update({
    where: { id: parseInt(id) },
    data: { password: hashedPassword },
  });

  res.status(200).json({
    success: true,
    message: 'Password changed successfully',
  });
});
