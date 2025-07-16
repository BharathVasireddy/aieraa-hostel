import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/admin/universities/[id] - Get specific university details
export async function GET(
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

    const university = await prisma.university.findUnique({
      where: { id },
      include: {
        settings: true,
        users: {
          where: {
            role: { in: ['MANAGER', 'CATERER'] }
          },
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            status: true,
            createdAt: true,
            lastLoginAt: true
          }
        },
        _count: {
          select: {
            users: {
              where: { role: 'STUDENT', status: 'APPROVED' }
            },
            orders: true,
            menuItems: { where: { isActive: true } }
          }
        }
      }
    })

    if (!university) {
      return NextResponse.json({ error: 'University not found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      university: {
        ...university,
        stats: {
          activeStudents: university._count.users,
          totalOrders: university._count.orders,
          activeMenuItems: university._count.menuItems
        }
      }
    })

  } catch (error) {
    console.error('Error fetching university:', error)
    return NextResponse.json(
      { error: 'Failed to fetch university details' },
      { status: 500 }
    )
  }
}

// PUT /api/admin/universities/[id] - Update university
export async function PUT(
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
    const body = await request.json()
    const { name, city, isActive, settings } = body

    // Check if university exists
    const existingUniversity = await prisma.university.findUnique({
      where: { id },
      include: { settings: true }
    })

    if (!existingUniversity) {
      return NextResponse.json({ error: 'University not found' }, { status: 404 })
    }

    // Check for name conflicts (excluding current university)
    if (name && name !== existingUniversity.name) {
      const nameConflict = await prisma.university.findFirst({
        where: {
          name,
          id: { not: id }
        }
      })

      if (nameConflict) {
        return NextResponse.json(
          { error: 'University with this name already exists' },
          { status: 400 }
        )
      }
    }

    // Update university
    const updateData: any = {}
    if (name) updateData.name = name
    if (city) updateData.city = city
    if (typeof isActive === 'boolean') updateData.isActive = isActive

    const university = await prisma.university.update({
      where: { id },
      data: updateData,
      include: {
        settings: true,
        users: {
          where: {
            role: { in: ['MANAGER', 'CATERER'] }
          },
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            status: true
          }
        }
      }
    })

    // Update settings if provided
    if (settings && existingUniversity.settings) {
      await prisma.universitySettings.update({
        where: { universityId: id },
        data: {
          cutoffHours: settings.cutoffHours || existingUniversity.settings.cutoffHours,
          maxAdvanceOrderDays: settings.maxAdvanceOrderDays || existingUniversity.settings.maxAdvanceOrderDays,
          minAdvanceOrderHours: settings.minAdvanceOrderHours || existingUniversity.settings.minAdvanceOrderHours,
          allowWeekendOrders: settings.allowWeekendOrders !== undefined ? settings.allowWeekendOrders : existingUniversity.settings.allowWeekendOrders,
          baseTaxRate: settings.baseTaxRate !== undefined ? settings.baseTaxRate : existingUniversity.settings.baseTaxRate,
          serviceTaxRate: settings.serviceTaxRate !== undefined ? settings.serviceTaxRate : existingUniversity.settings.serviceTaxRate,
          additionalTaxes: settings.additionalTaxes || existingUniversity.settings.additionalTaxes,
          contactEmail: settings.contactEmail || existingUniversity.settings.contactEmail,
          contactPhone: settings.contactPhone || existingUniversity.settings.contactPhone
        }
      })
    }

    console.log(`✅ University updated: ${university.name} by Super Admin: ${currentUser.name}`)

    return NextResponse.json({
      success: true,
      message: 'University updated successfully',
      university
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