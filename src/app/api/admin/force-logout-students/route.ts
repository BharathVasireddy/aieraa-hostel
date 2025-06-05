import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get current user
    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Only ADMIN (super admin) can force logout all student sessions
    if (currentUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Insufficient permissions. Only super admin can force logout all student sessions.' }, { status: 403 })
    }

    const body = await request.json()
    const { reason } = body

    // Create a global logout timestamp for all students
    const logoutTimestamp = new Date()

    // Update all student users with a forced logout timestamp
    const result = await prisma.user.updateMany({
      where: {
        role: 'STUDENT'
      },
      data: {
        forcedLogoutAt: logoutTimestamp
      }
    })

    // Log the admin action for audit purposes (console logging)
    const auditLog = {
      timestamp: logoutTimestamp.toISOString(),
      action: 'FORCE_LOGOUT_ALL_STUDENTS',
      adminId: currentUser.id,
      adminName: currentUser.name,
      adminEmail: currentUser.email,
      reason: reason || 'No reason provided',
      affectedStudents: result.count,
      details: 'Forced logout initiated by super admin - all student sessions invalidated'
    }

    console.log('🚨 CRITICAL ADMIN ACTION:', auditLog)

    return NextResponse.json({
      success: true,
      message: `Successfully forced logout for ${result.count} student sessions`,
      affectedStudents: result.count,
      timestamp: logoutTimestamp.toISOString(),
      reason: reason || 'No reason provided'
    })

  } catch (error) {
    console.error('❌ Error forcing student logout:', error)
    return NextResponse.json(
      { error: 'Failed to force logout student sessions' },
      { status: 500 }
    )
  }
} 