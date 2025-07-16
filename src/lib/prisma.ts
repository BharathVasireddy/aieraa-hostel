import { PrismaClient } from '../generated/prisma'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Enhanced Prisma configuration for performance and connection pooling
export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  },
  // Optimize for authentication workload
  transactionOptions: {
    maxWait: 2000, // 2 seconds max wait
    timeout: 5000, // 5 seconds timeout
  }
})

// Ensure proper connection handling in development
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

// Graceful shutdown handling
const shutdown = () => {
  prisma.$disconnect()
}

if (process.env.NODE_ENV !== 'production') {
  process.on('beforeExit', shutdown)
  process.on('SIGINT', shutdown)
  process.on('SIGTERM', shutdown)
} 