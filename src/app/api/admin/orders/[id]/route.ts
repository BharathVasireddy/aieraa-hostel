import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { isValidOrderStatus } from '@/lib/validation'
import { sendOrderStatusNotification } from '@/lib/notifications'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get current user with university info
    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check if user has admin privileges (ADMIN or MANAGER)
    if (!['ADMIN', 'MANAGER'].includes(currentUser.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const { id: orderId } = await params

    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      )
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            studentId: true
          }
        },
        orderItems: {
          include: {
            menuItem: {
              select: {
                id: true,
                name: true,
                basePrice: true,
                categories: true,
                image: true,
                isVegetarian: true
              }
            }
          }
        },
        university: {
          select: {
            id: true,
            name: true,
            code: true
          }
        }
      }
    })

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }

    // MANAGER can only access orders from their university
    if (currentUser.role === 'MANAGER' && order.universityId !== currentUser.universityId) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    return NextResponse.json(order)
  } catch (error) {
    console.error(error)
    return NextResponse.json(
      { error: 'Failed to fetch order' },
      { status: 500 }
    )
  }
}

// Admin can update order status
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get current user with university info
    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check if user has admin privileges (ADMIN or MANAGER)
    if (!['ADMIN', 'MANAGER'].includes(currentUser.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const { id: orderId } = await params
    const body = await request.json()
    const { status, rejectionReason } = body

    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      )
    }

    if (!status) {
      return NextResponse.json(
        { error: 'Status is required' },
        { status: 400 }
      )
    }

    // Validate status using utility function
    if (!isValidOrderStatus(status)) {
      return NextResponse.json(
        { error: 'Invalid status' },
        { status: 400 }
      )
    }

    // Check if order exists
    const existingOrder = await prisma.order.findUnique({
      where: { id: orderId }
    })

    if (!existingOrder) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }

    // MANAGER can only update orders from their university
    if (currentUser.role === 'MANAGER' && existingOrder.universityId !== currentUser.universityId) {
      return NextResponse.json(
        { error: 'Cannot update orders from other universities' },
        { status: 403 }
      )
    }

    // Update order status
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        status,
        ...(status === 'REJECTED' && rejectionReason && {
          // Store rejection reason in a metadata field or create a separate model
          // For now, we'll add this to special instructions
          specialInstructions: `REJECTED: ${rejectionReason}${existingOrder.specialInstructions ? ` | Original: ${existingOrder.specialInstructions}` : ''}`
        })
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true
          }
        },
        orderItems: {
          include: {
            menuItem: {
              select: {
                name: true
              }
            },
            variant: {
              select: {
                name: true
              }
            }
          }
        }
      }
    })

    // Send notification to student about order status change
    try {
      await sendOrderStatusNotification(updatedOrder, status, rejectionReason)
    } catch (notificationError) {
      console.error('Failed to send notification:', notificationError)
      // Don't fail the order update if notification fails
    }

    return NextResponse.json(updatedOrder)
  } catch (error) {
    console.error(error)
    return NextResponse.json(
      { error: 'Failed to update order' },
      { status: 500 }
    )
  }
} 