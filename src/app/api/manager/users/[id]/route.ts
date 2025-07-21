import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const UpdateUserStatusSchema = z.object({
  status: z.enum(['PENDING', 'APPROVED', 'SUSPENDED', 'REJECTED']),
  reason: z.string().optional()
})

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== 'MANAGER') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get current user to verify university
    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, role: true, universityId: true, name: true }
    })

    if (!currentUser || !currentUser.universityId) {
      return NextResponse.json({ error: 'Manager university not found' }, { status: 404 })
    }

    // Await params before accessing id
    const resolvedParams = await params
    const userId = resolvedParams.id
    
    // Parse and validate request body
    const body = await request.json()
    const validatedData = UpdateUserStatusSchema.parse(body)

    // Check if user exists and belongs to the same university
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        universityId: true,
        university: {
          select: { name: true, code: true }
        }
      }
    })

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Ensure user belongs to the manager's university
    if (targetUser.universityId !== currentUser.universityId) {
      return NextResponse.json({ 
        error: 'Cannot manage users from other universities' 
      }, { status: 403 })
    }

    // Prevent manager from changing their own status
    if (targetUser.id === currentUser.id) {
      return NextResponse.json({ 
        error: 'Cannot change your own status' 
      }, { status: 400 })
    }

    // Prevent manager from changing other manager's status
    if (targetUser.role === 'MANAGER' || targetUser.role === 'ADMIN') {
      return NextResponse.json({ 
        error: 'Cannot change status of other staff members' 
      }, { status: 403 })
    }

    const previousStatus = targetUser.status

    // Update user status
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        status: validatedData.status,
        // Update timestamps based on status change
        ...(validatedData.status === 'APPROVED' && previousStatus === 'PENDING' && {
          // Could add approvedAt timestamp if we add this field to schema
        })
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        studentId: true,
        university: {
          select: { name: true, code: true }
        }
      }
    })

    // Log the action for audit trail
    console.log(`Manager ${currentUser.name} (${currentUser.id}) changed status of user ${targetUser.name} (${targetUser.id}) from ${previousStatus} to ${validatedData.status}${validatedData.reason ? ` - Reason: ${validatedData.reason}` : ''}`)

    // TODO: Send notification to user about status change
    // TODO: If approved, could send welcome email
    // TODO: If suspended, could send notification with reason

    return NextResponse.json({
      success: true,
      user: updatedUser,
      message: `User ${validatedData.status.toLowerCase()} successfully`
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: 'Invalid request data',
        details: error.issues 
      }, { status: 400 })
    }

    console.error('Manager user update API error:', error)
    return NextResponse.json(
      { error: 'Failed to update user status' },
      { status: 500 }
    )
  }
}

// Get individual user details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== 'MANAGER') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get current user to verify university
    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, role: true, universityId: true }
    })

    if (!currentUser || !currentUser.universityId) {
      return NextResponse.json({ error: 'Manager university not found' }, { status: 404 })
    }

    // Await params before accessing id
    const resolvedParams = await params
    const userId = resolvedParams.id

    // Get user details
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        universityId: true,
        studentId: true,
        roomNumber: true,
        course: true,
        year: true,
        phone: true,
        createdAt: true,
        lastLoginAt: true,
        university: {
          select: {
            name: true,
            code: true
          }
        },
        // Get recent orders count
        orders: {
          select: { id: true },
          take: 1
        }
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Ensure user belongs to the manager's university
    if (user.universityId !== currentUser.universityId) {
      return NextResponse.json({ 
        error: 'Cannot access users from other universities' 
      }, { status: 403 })
    }

    // Get user's order statistics
    const orderStats = await prisma.order.aggregate({
      where: { userId: user.id },
      _count: { id: true },
      _sum: { totalAmount: true }
    })

    const userWithStats = {
      ...user,
      orderStats: {
        totalOrders: orderStats._count.id || 0,
        totalSpent: orderStats._sum.totalAmount || 0
      }
    }

    return NextResponse.json(userWithStats)

  } catch (error) {
    console.error('Manager user details API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch user details' },
      { status: 500 }
    )
  }
} 