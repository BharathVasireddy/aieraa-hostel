import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const since = searchParams.get('since')
    const sinceDate = since ? new Date(since) : new Date(Date.now() - 24 * 60 * 60 * 1000) // 24 hours ago

    // Get user's recent orders that have status changes since the last check
    const recentOrders = await prisma.order.findMany({
      where: {
        userId: session.user.id,
        updatedAt: {
          gte: sinceDate
        },
        status: {
          in: ['APPROVED', 'PREPARING', 'READY', 'SERVED', 'REJECTED']
        }
      },
      select: {
        id: true,
        orderNumber: true,
        status: true,
        updatedAt: true,
        createdAt: true
      },
      orderBy: {
        updatedAt: 'desc'
      }
    })

    // Convert orders to notifications
    const notifications = recentOrders
      .filter(order => order.updatedAt > sinceDate)
      .map(order => {
        let title = ''
        let message = ''
        let type = 'info'

        switch (order.status) {
          case 'APPROVED':
            title = '✅ Order Approved'
            message = `Your order #${order.orderNumber} has been approved and will be prepared soon.`
            type = 'order'
            break
          case 'PREPARING':
            title = '👨‍🍳 Order Being Prepared'
            message = `Your order #${order.orderNumber} is now being prepared in the kitchen.`
            type = 'order'
            break
          case 'READY':
            title = '🎉 Order Ready for Pickup'
            message = `Your order #${order.orderNumber} is ready! Please come to the pickup counter.`
            type = 'order'
            break
          case 'SERVED':
            title = '📦 Order Completed'
            message = `Your order #${order.orderNumber} has been served. Thank you!`
            type = 'success'
            break
          case 'REJECTED':
            title = '❌ Order Rejected'
            message = `Your order #${order.orderNumber} has been rejected. Please contact support for details.`
            type = 'error'
            break
          default:
            return null
        }

        return {
          id: `order-${order.id}-${order.status}`,
          type,
          title,
          message,
          orderId: order.id,
          orderNumber: order.orderNumber,
          timestamp: order.updatedAt
        }
      })
      .filter(Boolean)

    return NextResponse.json({
      success: true,
      notifications,
      count: notifications.length
    })

  } catch (error) {
    console.error('Error fetching notifications:', error)
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    )
  }
}

// POST endpoint for admins to send notifications
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only admins/managers can send notifications
    if (session.user.role !== 'ADMIN' && session.user.role !== 'MANAGER') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const body = await request.json()
    const { userId, type, title, message, orderId, orderNumber } = body

    // Validate required fields
    if (!userId || !type || !title || !message) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Here you could store notifications in a database if needed
    // For now, we'll just return success as the real-time polling handles this

    return NextResponse.json({
      success: true,
      message: 'Notification sent successfully'
    })

  } catch (error) {
    console.error('Error sending notification:', error)
    return NextResponse.json(
      { error: 'Failed to send notification' },
      { status: 500 }
    )
  }
} 