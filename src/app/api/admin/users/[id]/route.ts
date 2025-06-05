import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// PATCH /api/admin/users/[id] - Update user status (approve/reject)
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get current user to check permissions
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { university: true }
    })

    if (!currentUser || currentUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { status, rejectionReason } = await request.json()

    // Validate status
    if (!['APPROVED', 'REJECTED', 'SUSPENDED', 'PENDING'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    // Get the user to be updated
    const targetUser = await prisma.user.findUnique({
      where: { id: params.id },
      include: { university: true }
    })

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check if current user can manage this user (same university)
    if (targetUser.universityId !== currentUser.universityId) {
      return NextResponse.json({ 
        error: 'Cannot manage users from different universities' 
      }, { status: 403 })
    }

    // Update user status
    const updatedUser = await prisma.user.update({
      where: { id: params.id },
      data: {
        status,
        ...(status === 'REJECTED' && rejectionReason && {
          // You might want to add a rejectionReason field to the User model
        })
      },
      include: {
        university: {
          select: {
            id: true,
            name: true,
            code: true
          }
        }
      }
    })

    // Remove sensitive information
    const sanitizedUser = {
      id: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email,
      phone: updatedUser.phone,
      role: updatedUser.role,
      status: updatedUser.status,
      studentId: updatedUser.studentId,
      roomNumber: updatedUser.roomNumber,
      course: updatedUser.course,
      year: updatedUser.year,
      university: updatedUser.university,
      createdAt: updatedUser.createdAt,
      updatedAt: updatedUser.updatedAt,
      lastLoginAt: updatedUser.lastLoginAt
    }

    return NextResponse.json({ user: sanitizedUser })
  } catch (error) {
    console.error('Error updating user:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/users/[id] - Delete user (soft delete by setting status to REJECTED)
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get current user to check permissions
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { university: true }
    })

    if (!currentUser || currentUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get the user to be deleted
    const targetUser = await prisma.user.findUnique({
      where: { id: params.id }
    })

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check if current user can manage this user (same university)
    if (targetUser.universityId !== currentUser.universityId) {
      return NextResponse.json({ 
        error: 'Cannot manage users from different universities' 
      }, { status: 403 })
    }

    // Prevent self-deletion
    if (targetUser.id === currentUser.id) {
      return NextResponse.json({ 
        error: 'Cannot delete your own account' 
      }, { status: 400 })
    }

    // Soft delete by setting status to REJECTED
    await prisma.user.update({
      where: { id: params.id },
      data: {
        status: 'REJECTED'
      }
    })

    return NextResponse.json({ message: 'User deleted successfully' })
  } catch (error) {
    console.error('Error deleting user:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 