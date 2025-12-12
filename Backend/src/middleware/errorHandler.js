// src/middleware/errorHandler.js

class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    Error.captureStackTrace(this, this.constructor);
  }
}

export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

export const errorHandlerMiddleware = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.message = err.message || 'Internal Server Error';

  // Wrong ID format error (Prisma)
  if (err.name === 'PrismaClientKnownRequestError') {
    if (err.code === 'P2025') {
      return res.status(404).json({
        success: false,
        message: 'Resource not found',
      });
    }
    if (err.code === 'P2002') {
      const field = err.meta?.target?.[0];
      return res.status(409).json({
        success: false,
        message: `${field} already exists`,
      });
    }
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid token',
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Token expired',
    });
  }

  // Validation error
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: err.message,
    });
  }

  res.status(err.statusCode).json({
    success: false,
    message: err.message,
  });
};

export default AppError;
