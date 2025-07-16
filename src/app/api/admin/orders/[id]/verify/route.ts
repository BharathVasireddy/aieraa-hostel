import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

interface QRVerificationData {
  type: string
  orderId: string
  orderNumber: string
  studentName: string
  pickupLocation: string
  timestamp: string
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only admin/manager can verify pickups
    if (session.user.role !== 'ADMIN' && session.user.role !== 'MANAGER') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const orderId = resolvedParams.id
    const body = await request.json()
    
    // Parse QR data if provided
    let qrData: QRVerificationData | null = null
    if (body.qrData) {
      try {
        qrData = JSON.parse(body.qrData)
      } catch (error) {
        return NextResponse.json({ error: 'Invalid QR code data' }, { status: 400 })
      }
    }

    // Verify order exists
    const order = await prisma.order.findUnique({
      where: { id: orderId },
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
                name: true,
                categories: true
              }
            }
          }
        }
      }
    })

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // Verify university match
    if (order.universityId !== session.user.universityId) {
      return NextResponse.json({ error: 'Order not in your university' }, { status: 403 })
    }

    // Verify QR data matches order (if QR data provided)
    if (qrData) {
      if (qrData.orderId !== orderId || qrData.orderNumber !== order.orderNumber) {
        return NextResponse.json({ 
          error: 'QR code does not match order',
          details: 'Order ID or number mismatch'
        }, { status: 400 })
      }

      if (qrData.studentName !== order.user.name) {
        return NextResponse.json({ 
          error: 'QR code does not match order',
          details: 'Student name mismatch'
        }, { status: 400 })
      }

      // Verify QR code is not too old (e.g., 24 hours)
      const qrTimestamp = new Date(qrData.timestamp)
      const now = new Date()
      const hoursDiff = (now.getTime() - qrTimestamp.getTime()) / (1000 * 60 * 60)
      
      if (hoursDiff > 24) {
        return NextResponse.json({ 
          error: 'QR code expired',
          details: 'QR code is older than 24 hours'
        }, { status: 400 })
      }
    }

    // Check if order is in valid state for pickup
    if (!['READY', 'APPROVED'].includes(order.status)) {
      return NextResponse.json({ 
        error: 'Order not ready for pickup',
        details: `Order status is ${order.status}`,
        currentStatus: order.status
      }, { status: 400 })
    }

    // Mark order as served/picked up
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        status: 'SERVED',
        completedAt: new Date(),
        approvedBy: session.user.id,
        specialInstructions: body.pickupNotes || null
      }
    })

    // Log the pickup verification
    console.log(`Order ${order.orderNumber} picked up by ${order.user.name} - verified by ${session.user.name}`)

    return NextResponse.json({
      success: true,
      message: 'Order pickup verified successfully',
      order: {
        id: updatedOrder.id,
        orderNumber: updatedOrder.orderNumber,
        status: updatedOrder.status,
        studentName: order.user.name,
        studentEmail: order.user.email,
        totalAmount: updatedOrder.totalAmount,
        itemCount: order.orderItems.length,
        completedAt: updatedOrder.completedAt,
        verifiedBy: session.user.name
      }
    })

  } catch (error) {
    console.error(error)
    return NextResponse.json(
      { error: 'Failed to verify order pickup' },
      { status: 500 }
    )
  }
}

// GET endpoint to check order verification status
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const resolvedParams = await params
    const orderId = resolvedParams.id

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

    // Students can only view their own orders
    if (session.user.role === 'STUDENT' && order.userId !== session.user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Admins/Managers can only view orders from their university
    if ((session.user.role === 'ADMIN' || session.user.role === 'MANAGER') && 
        order.universityId !== session.user.universityId) {
      return NextResponse.json({ error: 'Order not in your university' }, { status: 403 })
    }

    return NextResponse.json({
      orderId: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      studentName: order.user.name,
      canPickup: ['READY', 'APPROVED'].includes(order.status),
      isServed: order.status === 'SERVED',
      completedAt: order.completedAt,
      createdAt: order.createdAt
    })

  } catch (error) {
    console.error(error)
    return NextResponse.json(
      { error: 'Failed to check order status' },
      { status: 500 }
    )
  }
} 