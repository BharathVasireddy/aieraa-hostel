import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get current user with university info
    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { university: true }
    })

    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check if user has admin privileges (ADMIN or MANAGER)
    if (!['ADMIN', 'MANAGER'].includes(currentUser.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Build dynamic where clause
    const whereClause: any = {}

    // MANAGER can only see students from their university
    // ADMIN can see students from all universities
    if (currentUser.role === 'MANAGER') {
      whereClause.universityId = currentUser.universityId
    }

    const users = await prisma.user.findMany({
      where: whereClause,
      include: {
        university: {
          select: {
            id: true,
            name: true,
            code: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Sanitize user data before returning
    const sanitizedUsers = users.map(user => ({
      id: user.id,
      name: user.name,
      email: user.email,
      status: user.status,
      role: user.role,
      studentId: user.studentId,
      course: user.course,
      year: user.year,
      roomNumber: user.roomNumber,
      phone: user.phone,
      createdAt: user.createdAt,
      university: user.university
    }))

    return NextResponse.json(sanitizedUsers)
    
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 