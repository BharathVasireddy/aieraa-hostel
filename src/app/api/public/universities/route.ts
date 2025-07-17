import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Direct function without caching
const getUniversities = async () => {
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
}

// GET /api/public/universities - Get active universities for student registration (no auth required)
export async function GET() {
  try {
    // Always fetch fresh data
    const universities = await getUniversities()

    return NextResponse.json(
      {
        success: true,
        universities
      },
      {
        headers: {
          // Disable all caching
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
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