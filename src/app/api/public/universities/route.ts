import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/public/universities - Get active universities for student registration (no auth required)
export async function GET() {
  try {
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

    return NextResponse.json({
      success: true,
      universities
    })
  } catch (error) {
    console.error('Error fetching public universities:', error)
    return NextResponse.json(
      { error: 'Failed to fetch universities' },
      { status: 500 }
    )
  }
} 