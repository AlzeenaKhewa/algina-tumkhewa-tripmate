// src/lib/prisma.js
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({ adapter })
  // Global error logging
  .$extends({
    query: {
      $allModels: {
        async $allOperations({ query, args }) {
          try {
            return await query(args);
          } catch (error) {
            console.error('Prisma query failed:', error);
            throw error;
          }
        },
      },
    },
  });

// Test connection on startup
export const testConnection = async () => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    console.log('✓ Database connection successful');
    return true;
  } catch (error) {
    console.error('✗ Database connection failed:', error);
    return false;
  }
};

// Graceful shutdown
export const disconnectDatabase = async () => {
  try {
    await prisma.$disconnect();
    console.log('✓ Database disconnected');
  } catch (error) {
    console.error('✗ Error disconnecting database:', error);
  }
};

export default prisma;
