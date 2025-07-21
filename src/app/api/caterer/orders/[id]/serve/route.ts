import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendNotificationToUser } from '@/lib/notifications'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const resolvedParams = await params
    const orderId = resolvedParams.id

    // Get the order
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        }
      }
    })

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // Check if order belongs to caterer's university
    if (order.universityId !== currentUser.universityId) {
      return NextResponse.json({ error: 'Access denied. Order not from your university.' }, { status: 403 })
    }

    // Check if order can be served (should be READY status)
    if (order.status !== 'READY') {
      return NextResponse.json({ 
        error: `Order cannot be served. Current status: ${order.status}. Order must be READY to be served.` 
      }, { status: 400 })
    }

    // Update order status to SERVED
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        status: 'SERVED',
        completedAt: new Date()
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        orderItems: {
          include: {
            menuItem: {
              select: {
                name: true
              }
            }
          }
        }
      }
    })

    // Send push notification to student
    try {
      const notificationResult = await sendNotificationToUser(updatedOrder.user.id, {
        title: 'Your order has been served! ✅',
        body: 'Your order has been served successfully. Thank you for using our service!',
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-192x192.png',
        data: {
          orderId: updatedOrder.id,
          orderNumber: updatedOrder.orderNumber,
          status: 'SERVED',
          url: `/student/orders/${updatedOrder.orderNumber}`,
          timestamp: Date.now()
        }
      })

      console.log('📱 CATERER NOTIFICATION SENT:', {
        orderId: updatedOrder.id,
        orderNumber: updatedOrder.orderNumber,
        studentName: updatedOrder.user.name,
        status: 'SERVED',
        sent: notificationResult.sent || 0,
        total: notificationResult.total || 0,
        success: notificationResult.success
      })
    } catch (notificationError) {
      console.error('❌ Failed to send caterer notification:', notificationError)
      // Don't fail the order update if notification fails
    }

    return NextResponse.json({
      message: 'Order marked as served successfully',
      order: {
        id: updatedOrder.id,
        orderNumber: updatedOrder.orderNumber,
        status: updatedOrder.status,
        customerName: updatedOrder.user.name,
        completedAt: updatedOrder.completedAt
      }
    })
  } catch (error) {
    console.error(error)
    return NextResponse.json(
      { error: 'Failed to mark order as served' },
      { status: 500 }
    )
  }
} 