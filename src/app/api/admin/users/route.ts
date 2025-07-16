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

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const roleFilter = searchParams.get('role')
    const statusFilter = searchParams.get('status')
    const unassignedFilter = searchParams.get('unassigned')

    // Build dynamic where clause
    const whereClause: any = {}

    // Filter by unassigned users (for staff assignment) - this takes precedence
    if (unassignedFilter === 'true') {
      whereClause.universityId = null
    } else {
      // MANAGER can only see students from their university
      // ADMIN can see students from all universities or filter by specific criteria
      if (currentUser.role === 'MANAGER') {
        whereClause.universityId = currentUser.universityId
      }
    }

    // Filter by role (supports comma-separated values)
    if (roleFilter) {
      const roles = roleFilter.split(',').map(role => role.trim())
      if (roles.length === 1) {
        whereClause.role = roles[0]
      } else {
        whereClause.role = { in: roles }
      }
    }

    // Filter by status
    if (statusFilter) {
      whereClause.status = statusFilter
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

    return NextResponse.json({
      success: true,
      users: sanitizedUsers
    })
    
  } catch (error) {
    console.error(error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 