// server.js
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';

// Import utilities
import { logger } from './src/utils/logger.js';
import { errorHandlerMiddleware, asyncHandler } from './src/middleware/errorHandler.js';

// Import database
import prisma, { testConnection, disconnectDatabase } from './src/lib/prisma.js';

// Import routes
import authRoutes from './src/routes/auth.routes.js';
import userRoutes from './src/routes/userRoutes.js';
import postRoutes from './src/routes/postRoutes.js';
import adminRoutes from './src/routes/admin.routes.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// ============================================================
// TRUST PROXY (For reverse proxies like Nginx)
// ============================================================
app.set('trust proxy', 1);

// ============================================================
// SECURITY MIDDLEWARE
// ============================================================

// Helmet - Set security HTTP headers
app.use(helmet({
  contentSecurityPolicy: NODE_ENV === 'production',
  crossOriginEmbedderPolicy: false,
}));

// CORS - Configure cross-origin requests
app.use(
  cors({
    origin: (process.env.CORS_ORIGIN || 'http://localhost:3000').split(','),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    maxAge: 86400, // 24 hours
  })
);

// ============================================================
// BODY PARSING MIDDLEWARE
// ============================================================

// Parse cookies
app.use(cookieParser());

// Parse JSON payloads
app.use(express.json({ limit: '10mb' }));

// Parse URL-encoded payloads
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// ============================================================
// LOGGING MIDDLEWARE
// ============================================================
if (NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// ============================================================
// REQUEST LOGGING
// ============================================================
app.use((req, res, next) => {
  logger.debug(`${req.method} ${req.path}`);
  next();
});

// ============================================================
// ROUTES
// ============================================================

// Health Check
app.get('/api/health', asyncHandler(async (req, res) => {
  const dbHealth = await testConnection();
  res.status(200).json({
    success: true,
    message: 'Server is running',
    database: dbHealth ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString(),
    environment: NODE_ENV,
  });
}));

// API v1 Routes
const apiRouter = express.Router();

// Authentication Routes
apiRouter.use('/auth', authRoutes);

// User Routes
apiRouter.use('/users', userRoutes);

// Post Routes
apiRouter.use('/posts', postRoutes);

// Admin Routes
apiRouter.use('/admin', adminRoutes);

app.use('/api', apiRouter);

// ============================================================
// 404 NOT FOUND HANDLER
// ============================================================
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

// ============================================================
// GLOBAL ERROR HANDLER (Must be last)
// ============================================================
app.use(errorHandlerMiddleware);

// ============================================================
// SERVER STARTUP
// ============================================================
const server = app.listen(PORT, async () => {
  try {
    // Test database connection
    const connected = await testConnection();
    
    if (!connected) {
      throw new Error('Database connection failed');
    }

    logger.info(`🚀 Server running on port ${PORT}`);
    logger.info(`📝 Environment: ${NODE_ENV}`);
    logger.info(`🌐 API URL: http://localhost:${PORT}`);
    logger.info(`✅ All systems operational`);
  } catch (error) {
    logger.error('❌ Server startup failed:', error.message);
    process.exit(1);
  }
});

// ============================================================
// GRACEFUL SHUTDOWN
// ============================================================
process.on('SIGTERM', async () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  server.close(async () => {
    await disconnectDatabase();
    logger.info('HTTP server closed');
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  logger.info('SIGINT signal received: closing HTTP server');
  server.close(async () => {
    await disconnectDatabase();
    logger.info('HTTP server closed');
    process.exit(0);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

export default app;
