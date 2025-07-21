import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Optimized Prisma configuration for high performance
export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  },
  // Optimized transaction settings
  transactionOptions: {
    maxWait: 5000, // 5 seconds max wait
    timeout: 10000, // 10 seconds timeout
  },
  errorFormat: 'minimal',
})

// Simple connection health check
export const checkConnection = async () => {
  try {
    await prisma.$queryRaw`SELECT 1`
    return true
  } catch (error) {
    console.error('Database connection error:', error)
    return false
  }
}

// Connection with automatic retry
export const connectWithRetry = async (retries = 3) => {
  for (let i = 0; i < retries; i++) {
    try {
      await prisma.$connect()
      return true
    } catch (error) {
      console.warn(`Database connection attempt ${i + 1} failed:`, error)
      if (i === retries - 1) throw error
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)))
    }
  }
  return false
}

// Add the missing ensureConnection function
export const ensureConnection = async () => {
  try {
    await prisma.$connect()
    return true
  } catch (error) {
    console.error('Failed to ensure database connection:', error)
    return false
  }
}

// Ensure proper connection handling in development
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

// Clean shutdown handling
const gracefulShutdown = async () => {
  try {
    await prisma.$disconnect()
  } catch (error) {
    console.error('Error during database disconnect:', error)
  }
}

// Only add shutdown handlers in production
if (process.env.NODE_ENV === 'production') {
  process.on('beforeExit', gracefulShutdown)
  process.on('SIGINT', gracefulShutdown)
  process.on('SIGTERM', gracefulShutdown)
} 