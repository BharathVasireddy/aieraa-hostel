import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/student/cutoff-info - Get cutoff time for student's university
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get current user
    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { 
        id: true, 
        role: true, 
        universityId: true,
        university: {
          select: {
            name: true,
            settings: {
              select: {
                cutoffHours: true,
                maxAdvanceOrderDays: true,
                minAdvanceOrderHours: true,
                allowWeekendOrders: true
              }
            }
          }
        }
      }
    })

    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Allow both students and managers to access this endpoint
    if (!['STUDENT', 'MANAGER'].includes(currentUser.role)) {
      return NextResponse.json({ 
        error: 'Access denied. Student or Manager privileges required.' 
      }, { status: 403 })
    }

    if (!currentUser.universityId) {
      return NextResponse.json({ 
        error: 'Student is not associated with a university' 
      }, { status: 400 })
    }

    // Get university settings or use defaults
    const settings = currentUser.university?.settings
    const cutoffHours = settings?.cutoffHours ?? 22 // Default to 10 PM
    const maxAdvanceOrderDays = settings?.maxAdvanceOrderDays ?? 7
    const minAdvanceOrderHours = settings?.minAdvanceOrderHours ?? 12
    const allowWeekendOrders = settings?.allowWeekendOrders ?? true

    return NextResponse.json({
      success: true,
      cutoffHours,
      maxAdvanceOrderDays,
      minAdvanceOrderHours,
      allowWeekendOrders,
      universityName: currentUser.university?.name || 'University'
    })

  } catch (error) {
    console.error('Student cutoff info GET error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch cutoff information' },
      { status: 500 }
    )
  }
} 