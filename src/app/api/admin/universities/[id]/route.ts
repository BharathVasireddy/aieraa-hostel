import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/admin/universities/[id] - Get individual university details
export async function GET(
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

    // Only ADMIN (Super Admin) can access university details
    if (currentUser.role !== 'ADMIN') {
      return NextResponse.json({ 
        error: 'Access denied. Super Admin privileges required.' 
      }, { status: 403 })
    }

    const university = await prisma.university.findUnique({
      where: { id: params.id },
      include: {
        settings: true,
        _count: {
          select: {
            users: {
              where: { role: 'STUDENT', status: 'APPROVED' }
            },
            orders: true,
            menuItems: { where: { isActive: true } }
          }
        },
        users: {
          where: {
            role: { in: ['MANAGER', 'CATERER'] }
          },
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            role: true,
            status: true,
            createdAt: true
          }
        }
      }
    })

    if (!university) {
      return NextResponse.json({ error: 'University not found' }, { status: 404 })
    }

    const universityWithStats = {
      ...university,
      stats: {
        activeStudents: university._count.users,
        totalOrders: university._count.orders,
        activeMenuItems: university._count.menuItems
      }
    }

    return NextResponse.json({
      success: true,
      university: universityWithStats
    })

  } catch (error) {
    console.error('Error fetching university:', error)
    return NextResponse.json(
      { error: 'Failed to fetch university' },
      { status: 500 }
    )
  }
}

// PUT /api/admin/universities/[id] - Update university details
export async function PUT(
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

    // Only ADMIN (Super Admin) can update universities
    if (currentUser.role !== 'ADMIN') {
      return NextResponse.json({ 
        error: 'Access denied. Super Admin privileges required.' 
      }, { status: 403 })
    }

    const body = await request.json()
    const { name, code, city, isActive, settings } = body

    // Validate required fields
    if (!name || !code || !city) {
      return NextResponse.json(
        { error: 'University name, code, and city are required' },
        { status: 400 }
      )
    }

    // Validate code format
    const codeRegex = /^[A-Z0-9]{2,10}$/
    if (!codeRegex.test(code)) {
      return NextResponse.json(
        { error: 'University code must be 2-10 characters, uppercase letters and numbers only' },
        { status: 400 }
      )
    }

    // Check if university exists
    const existingUniversity = await prisma.university.findUnique({
      where: { id: params.id }
    })

    if (!existingUniversity) {
      return NextResponse.json({ error: 'University not found' }, { status: 404 })
    }

    // Check if another university with same name exists (excluding current one)
    const duplicateName = await prisma.university.findFirst({
      where: { 
        name,
        id: { not: params.id }
      }
    })

    if (duplicateName) {
      return NextResponse.json(
        { error: 'University with this name already exists' },
        { status: 400 }
      )
    }

    // Check if another university with same code exists (excluding current one)
    const duplicateCode = await prisma.university.findFirst({
      where: { 
        code,
        id: { not: params.id }
      }
    })

    if (duplicateCode) {
      return NextResponse.json(
        { error: 'University code already exists. Please choose a different code.' },
        { status: 400 }
      )
    }

    // Update university and settings
    const updatedUniversity = await prisma.university.update({
      where: { id: params.id },
      data: {
        name,
        code,
        city,
        isActive,
        settings: {
          update: {
            cutoffHours: settings?.cutoffHours || 22,
            maxAdvanceOrderDays: settings?.maxAdvanceOrderDays || 7,
            minAdvanceOrderHours: settings?.minAdvanceOrderHours || 12,
            allowWeekendOrders: settings?.allowWeekendOrders !== undefined ? settings.allowWeekendOrders : true,
            baseTaxRate: settings?.baseTaxRate || 0.0,
            serviceTaxRate: settings?.serviceTaxRate || 0.0
          }
        }
      },
      include: {
        settings: true,
        _count: {
          select: {
            users: {
              where: { role: 'STUDENT', status: 'APPROVED' }
            },
            orders: true,
            menuItems: { where: { isActive: true } }
          }
        },
        users: {
          where: {
            role: { in: ['MANAGER', 'CATERER'] }
          },
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            role: true,
            status: true,
            createdAt: true
          }
        }
      }
    })

    console.log(`✅ University updated: ${updatedUniversity.name} (${updatedUniversity.code}) by Super Admin: ${currentUser.name}`)

    const universityWithStats = {
      ...updatedUniversity,
      stats: {
        activeStudents: updatedUniversity._count.users,
        totalOrders: updatedUniversity._count.orders,
        activeMenuItems: updatedUniversity._count.menuItems
      }
    }

    return NextResponse.json({
      success: true,
      message: 'University updated successfully',
      university: universityWithStats
    })

  } catch (error) {
    console.error('Error updating university:', error)
    return NextResponse.json(
      { error: 'Failed to update university' },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/universities/[id] - Soft delete university (deactivate)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!currentUser || currentUser.role !== 'ADMIN') {
      return NextResponse.json({ 
        error: 'Access denied. Super Admin privileges required.' 
      }, { status: 403 })
    }

    const { id } = await params

    // Check if university exists and has any active data
    const university = await prisma.university.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            users: { where: { status: 'APPROVED' } },
            orders: { where: { status: { in: ['PENDING', 'APPROVED', 'PREPARING', 'READY'] } } }
          }
        }
      }
    })

    if (!university) {
      return NextResponse.json({ error: 'University not found' }, { status: 404 })
    }

    // Warn if there are active users or pending orders
    const warnings = []
    if (university._count.users > 0) {
      warnings.push(`${university._count.users} active users will lose access`)
    }
    if (university._count.orders > 0) {
      warnings.push(`${university._count.orders} pending/active orders will be affected`)
    }

    // Soft delete by deactivating
    await prisma.university.update({
      where: { id },
      data: { isActive: false }
    })

    console.log(`⚠️ University deactivated: ${university.name} by Super Admin: ${currentUser.name}`)
    if (warnings.length > 0) {
      console.log(`⚠️ Warnings: ${warnings.join(', ')}`)
    }

    return NextResponse.json({
      success: true,
      message: 'University deactivated successfully',
      warnings
    })

  } catch (error) {
    console.error('Error deactivating university:', error)
    return NextResponse.json(
      { error: 'Failed to deactivate university' },
      { status: 500 }
    )
  }
} 