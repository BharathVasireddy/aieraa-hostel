import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Users can only access their own data (or admins can access any)
    if (session.user.id !== params.id && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Optimized query - only fetch essential user data for dashboard
    const user = await prisma.user.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        status: true,
        studentId: true,
        roomNumber: true,
        course: true,
        year: true,
        profileImage: true,
        dietaryPreferences: true,
        createdAt: true,
        lastLoginAt: true,
        university: {
          select: {
            id: true,
            name: true,
            code: true
          }
        }
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // No need to filter password since we're using select
    return NextResponse.json({
      success: true,
      user: user
    })

  } catch (error) {
    console.error(error)
    return NextResponse.json(
      { error: 'Failed to fetch user data' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    console.log('🔧 PATCH request received for user profile update')
    const params = await context.params
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Users can only update their own data (or admins can update any)
    if (session.user.id !== params.id && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { profileImage, name, phone, roomNumber, course, year, dietaryPreferences } = body

    // Build update data object with only provided fields
    const updateData: any = {}
    
    if (profileImage !== undefined) updateData.profileImage = profileImage
    if (name !== undefined) updateData.name = name
    if (phone !== undefined) updateData.phone = phone
    if (roomNumber !== undefined) updateData.roomNumber = roomNumber
    if (course !== undefined) updateData.course = course
    if (year !== undefined) updateData.year = year
    if (dietaryPreferences !== undefined) updateData.dietaryPreferences = dietaryPreferences

    console.log('📝 Updating user profile:', {
      userId: params.id,
      updateData: updateData,
      sessionUserId: session.user.id
    })

    // Update user in database
    const updatedUser = await prisma.user.update({
      where: { id: params.id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        status: true,
        studentId: true,
        roomNumber: true,
        course: true,
        year: true,
        profileImage: true,
        dietaryPreferences: true,
        createdAt: true,
        lastLoginAt: true,
        university: {
          select: {
            id: true,
            name: true,
            code: true
          }
        }
      }
    })

    console.log('✅ User profile updated successfully:', {
      userId: params.id,
      updatedFields: Object.keys(updateData),
      profileImage: updatedUser.profileImage ? 'Set' : 'Not set'
    })

    return NextResponse.json({
      success: true,
      user: updatedUser
    })

  } catch (error) {
    console.error(error)
    return NextResponse.json(
      { error: 'Failed to update user data' },
      { status: 500 }
    )
  }
} 