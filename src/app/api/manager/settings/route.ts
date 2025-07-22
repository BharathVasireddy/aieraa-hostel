import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/manager/settings - Get manager's university settings
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get current user
    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, role: true, universityId: true }
    })

    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Only MANAGER can access their university settings
    if (currentUser.role !== 'MANAGER') {
      return NextResponse.json({ 
        error: 'Access denied. Manager privileges required.' 
      }, { status: 403 })
    }

    if (!currentUser.universityId) {
      return NextResponse.json({ 
        error: 'Manager is not associated with a university' 
      }, { status: 400 })
    }

    // Get university with settings
    const university = await prisma.university.findUnique({
      where: { id: currentUser.universityId },
      include: {
        settings: true
      }
    })

    if (!university) {
      return NextResponse.json({ error: 'University not found' }, { status: 404 })
    }

    // If no settings exist, create default settings
    if (!university.settings) {
      const defaultSettings = await prisma.universitySettings.create({
        data: {
          universityId: university.id,
          cutoffHours: 22, // 10 PM default
          maxAdvanceOrderDays: 7,
          minAdvanceOrderHours: 12,
          allowWeekendOrders: true,
          baseTaxRate: 0.0,
          serviceTaxRate: 0.0
        }
      })

      university.settings = defaultSettings
    }

    return NextResponse.json({
      success: true,
      university: {
        id: university.id,
        name: university.name,
        code: university.code,
        settings: university.settings
      }
    })

  } catch (error) {
    console.error('Manager settings GET error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch university settings' },
      { status: 500 }
    )
  }
}

// PUT /api/manager/settings - Update manager's university settings (cutoff time only)
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get current user
    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, role: true, universityId: true, name: true }
    })

    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Only MANAGER can update their university settings
    if (currentUser.role !== 'MANAGER') {
      return NextResponse.json({ 
        error: 'Access denied. Manager privileges required.' 
      }, { status: 403 })
    }

    if (!currentUser.universityId) {
      return NextResponse.json({ 
        error: 'Manager is not associated with a university' 
      }, { status: 400 })
    }

    const body = await request.json()
    const { settings } = body

    // Validate cutoff hours
    if (settings?.cutoffHours !== undefined) {
      const cutoffHours = parseInt(settings.cutoffHours)
      if (isNaN(cutoffHours) || cutoffHours < 0 || cutoffHours > 23) {
        return NextResponse.json(
          { error: 'Cutoff hours must be between 0 and 23' },
          { status: 400 }
        )
      }
    }

    // Check if university exists
    const university = await prisma.university.findUnique({
      where: { id: currentUser.universityId },
      include: { settings: true }
    })

    if (!university) {
      return NextResponse.json({ error: 'University not found' }, { status: 404 })
    }

    // Update only the cutoff hours (managers can only modify this setting)
    const updatedSettings = await prisma.universitySettings.upsert({
      where: { universityId: currentUser.universityId },
      update: {
        cutoffHours: settings.cutoffHours,
        // Keep all other settings unchanged
      },
      create: {
        universityId: currentUser.universityId,
        cutoffHours: settings.cutoffHours || 22,
        maxAdvanceOrderDays: 7,
        minAdvanceOrderHours: 12,
        allowWeekendOrders: true,
        baseTaxRate: 0.0,
        serviceTaxRate: 0.0
      }
    })

    console.log(`✅ Manager ${currentUser.name} updated cutoff time for ${university.name} to ${settings.cutoffHours}:00`)

    // Return the updated university with settings
    const updatedUniversity = await prisma.university.findUnique({
      where: { id: currentUser.universityId },
      include: { settings: true }
    })

    return NextResponse.json({
      success: true,
      message: 'Settings updated successfully',
      university: {
        id: updatedUniversity!.id,
        name: updatedUniversity!.name,
        code: updatedUniversity!.code,
        settings: updatedUniversity!.settings
      }
    })

  } catch (error) {
    console.error('Manager settings PUT error:', error)
    return NextResponse.json(
      { error: 'Failed to update university settings' },
      { status: 500 }
    )
  }
} 