import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { serverCache } from '@/lib/cache'

// Cached function for university data with 30-minute cache
const getCachedUniversities = serverCache(
  async () => {
    // Only return active universities for student registration
    const universities = await prisma.university.findMany({
      where: {
        isActive: true // Only show active universities to students
      },
      select: {
        id: true,
        name: true,
        code: true,
        city: true
      },
      orderBy: {
        name: 'asc'
      }
    })

    return universities
  },
  ['universities-public'], // Cache key
  { 
    revalidate: 30 * 60, // 30 minutes cache
    tags: ['universities', 'public'] 
  }
)

// GET /api/public/universities - Get active universities for student registration (no auth required)
export async function GET() {
  try {
    // Use cached function for blazing-fast response
    const universities = await getCachedUniversities()

    return NextResponse.json(
      {
        success: true,
        universities
      },
      {
        headers: {
          // Enable browser caching for 15 minutes
          'Cache-Control': 'public, max-age=900, stale-while-revalidate=1800',
          // Add performance headers
          'X-Content-Type-Options': 'nosniff',
          'X-Frame-Options': 'DENY'
        }
      }
    )
  } catch (error) {
    console.error('Error fetching universities:', error)
    return NextResponse.json(
      { error: 'Failed to fetch universities' },
      { status: 500 }
    )
  }
} 