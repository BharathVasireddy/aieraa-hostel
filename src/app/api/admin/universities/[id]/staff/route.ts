import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// POST /api/admin/universities/[id]/staff - Assign user to university
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params
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

    // Only ADMIN (Super Admin) can assign staff
    if (currentUser.role !== 'ADMIN') {
      return NextResponse.json({ 
        error: 'Access denied. Super Admin privileges required.' 
      }, { status: 403 })
    }

    const body = await request.json()
    const { userId, role, name, email, phone, password } = body

    // Determine if this is an assignment or creation operation
    const isAssignment = !!userId
    const isCreation = !!(name && email && password)

    if (!isAssignment && !isCreation) {
      return NextResponse.json(
        { error: 'Either userId and role (for assignment) or name, email, and password (for creation) are required' },
        { status: 400 }
      )
    }

    // Validate role
    if (!role || !['MANAGER', 'CATERER'].includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role. Must be MANAGER or CATERER' },
        { status: 400 }
      )
    }

    // Check if university exists
    const university = await prisma.university.findUnique({
      where: { id: params.id }
    })

    if (!university) {
      return NextResponse.json({ error: 'University not found' }, { status: 404 })
    }

    let user;
    let operationType;

    if (isAssignment) {
      // Handle assignment of existing user
      operationType = 'assignment'
      
      // Check if user exists and has correct role
      user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          university: true
        }
      })

      if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 })
      }

      if (user.role !== role) {
        return NextResponse.json(
          { error: `User role must be ${role}` },
          { status: 400 }
        )
      }

      if (user.status !== 'APPROVED') {
        return NextResponse.json(
          { error: 'User must be approved before assignment' },
          { status: 400 }
        )
      }

      // Check if user is already assigned to this university
      if (user.universityId === params.id) {
        return NextResponse.json(
          { error: 'User is already assigned to this university' },
          { status: 400 }
        )
      }

      // Assign user to university
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          universityId: params.id
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

      user = updatedUser
      console.log(`✅ User assigned: ${user.name} (${user.role}) to ${university.name} by Super Admin: ${currentUser.name}`)
      
    } else {
      // Handle creation of new user
      operationType = 'creation'
      
      // Check if user with this email already exists
      const existingUser = await prisma.user.findUnique({
        where: { email }
      })

      if (existingUser) {
        return NextResponse.json(
          { error: 'User with this email already exists' },
          { status: 400 }
        )
      }

      // Create new user and assign to university
      const bcrypt = require('bcryptjs')
      const hashedPassword = await bcrypt.hash(password, 10)

      const newUser = await prisma.user.create({
        data: {
          name,
          email,
          phone: phone || null,
          password: hashedPassword,
          role,
          status: 'APPROVED', // Auto-approve staff created by admin
          universityId: params.id
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

      user = newUser
      console.log(`✅ User created and assigned: ${user.name} (${user.role}) to ${university.name} by Super Admin: ${currentUser.name}`)
    }

    return NextResponse.json({
      success: true,
      message: `${role} ${operationType === 'assignment' ? 'assigned' : 'created'} successfully`,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        status: user.status,
        university: user.university
      }
    })

  } catch (error) {
    console.error('Error assigning user to university:', error)
    return NextResponse.json(
      { error: 'Failed to assign user to university' },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/universities/[id]/staff - Remove user from university
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params
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

    // Only ADMIN (Super Admin) can remove staff
    if (currentUser.role !== 'ADMIN') {
      return NextResponse.json({ 
        error: 'Access denied. Super Admin privileges required.' 
      }, { status: 403 })
    }

    const body = await request.json()
    const { userId } = body

    // Validate required fields
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    // Check if university exists
    const university = await prisma.university.findUnique({
      where: { id: params.id }
    })

    if (!university) {
      return NextResponse.json({ error: 'University not found' }, { status: 404 })
    }

    // Check if user exists and is assigned to this university
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        university: true
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (user.universityId !== params.id) {
      return NextResponse.json(
        { error: 'User is not assigned to this university' },
        { status: 400 }
      )
    }

    // Remove user from university
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        universityId: undefined
      }
    })

    console.log(`✅ User removed: ${updatedUser.name} (${updatedUser.role}) from ${university.name} by Super Admin: ${currentUser.name}`)

    return NextResponse.json({
      success: true,
      message: 'User removed from university successfully',
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        status: updatedUser.status
      }
    })

  } catch (error) {
    console.error('Error removing user from university:', error)
    return NextResponse.json(
      { error: 'Failed to remove user from university' },
      { status: 500 }
    )
  }
} 