import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const startTime = Date.now()
  
  try {
    // Simple database health check
    const result = await prisma.$queryRaw`SELECT 1 as health`
    const dbTime = Date.now() - startTime
    
    return NextResponse.json({
      status: 'healthy',
      database: 'connected',
      responseTime: `${dbTime}ms`,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    const dbTime = Date.now() - startTime
    console.error('Database health check failed:', error)
    
    return NextResponse.json({
      status: 'unhealthy',
      database: 'disconnected',
      responseTime: `${dbTime}ms`,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
} 