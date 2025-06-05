import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
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

    // Check if user is a caterer
    if (currentUser.role !== 'CATERER') {
      return NextResponse.json({ error: 'Access denied. Caterer role required.' }, { status: 403 })
    }

    // Calculate date range for today
    const today = new Date()
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0)
    const endOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59)

    // Get all orders for this university
    const baseWhere = {
      universityId: currentUser.universityId
    }

    // Get pending orders (PENDING, APPROVED, PREPARING)
    const pendingOrders = await prisma.order.count({
      where: {
        ...baseWhere,
        status: {
          in: ['PENDING', 'APPROVED', 'PREPARING']
        }
      }
    })

    // Get ready orders
    const readyOrders = await prisma.order.count({
      where: {
        ...baseWhere,
        status: 'READY'
      }
    })

    // Get served orders today
    const servedToday = await prisma.order.count({
      where: {
        ...baseWhere,
        status: 'SERVED',
        createdAt: {
          gte: startOfToday,
          lte: endOfToday
        }
      }
    })

    // Get total orders today
    const totalToday = await prisma.order.count({
      where: {
        ...baseWhere,
        createdAt: {
          gte: startOfToday,
          lte: endOfToday
        }
      }
    })

    const stats = {
      pendingOrders,
      readyOrders,
      servedToday,
      totalToday
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error('Error fetching caterer stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    )
  }
} 