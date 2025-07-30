import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { sendNotificationToUser } from '@/lib/notifications';

const UpdateOrderStatusSchema = z.object({
  status: z.enum(['APPROVED', 'PREPARING', 'READY', 'SERVED', 'CANCELLED']),
  notes: z.string().optional(),
});

// Get individual order details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'MANAGER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, role: true, universityId: true },
    });

    if (!currentUser?.universityId) {
      return NextResponse.json(
        { error: 'Manager university not found' },
        { status: 404 }
      );
    }

    const resolvedParams = await params;
    const orderId = resolvedParams.id;

    // Get order details
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            studentId: true,
            phone: true,
            roomNumber: true,
          },
        },
        orderItems: {
          include: {
            menuItem: {
              select: {
                id: true,
                name: true,
                description: true,
                basePrice: true,
                categories: true,
                image: true,
              },
            },
          },
        },
        university: {
          select: {
            name: true,
            code: true,
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Ensure order belongs to manager's university
    if (order.universityId !== currentUser.universityId) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    return NextResponse.json({
      ...order,
      orderItems: order.orderItems.map(item => ({
        ...item,
        menuItem: {
          ...item.menuItem,
          category: item.menuItem.categories?.[0] || 'GENERAL',
          imageUrl: item.menuItem.image, // Map image to imageUrl for frontend compatibility
        },
      })),
    });
  } catch (error) {
    console.error('Manager order details API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch order details' },
      { status: 500 }
    );
  }
}

// Update order status
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'MANAGER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, role: true, universityId: true, name: true },
    });

    if (!currentUser?.universityId) {
      return NextResponse.json(
        { error: 'Manager university not found' },
        { status: 404 }
      );
    }

    const resolvedParams = await params;
    const orderId = resolvedParams.id;

    // Parse and validate request body
    const body = await request.json();
    const validatedData = UpdateOrderStatusSchema.parse(body);

    // Check if order exists and belongs to manager's university
    const existingOrder = await prisma.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        orderNumber: true,
        status: true,
        universityId: true,
        user: {
          select: { name: true, email: true },
        },
      },
    });

    if (!existingOrder) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    if (existingOrder.universityId !== currentUser.universityId) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Validate status transition
    const allowedTransitions: Record<string, string[]> = {
      PENDING: ['APPROVED', 'CANCELLED'],
      APPROVED: ['PREPARING', 'CANCELLED'],
      PREPARING: ['READY', 'CANCELLED'],
      READY: ['SERVED', 'CANCELLED'],
      SERVED: [], // Final state
      CANCELLED: [], // Final state
    };

    const currentStatus = existingOrder.status;
    const newStatus = validatedData.status;

    if (!allowedTransitions[currentStatus]?.includes(newStatus)) {
      return NextResponse.json(
        {
          error: `Cannot transition from ${currentStatus} to ${newStatus}`,
        },
        { status: 400 }
      );
    }

    // Update order status
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        status: validatedData.status,
        ...(validatedData.notes && { notes: validatedData.notes }),
        updatedAt: new Date(),
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            studentId: true,
          },
        },
      },
    });

    // Log the status change
    console.log(
      `Manager ${currentUser.name} updated order ${existingOrder.orderNumber} from ${currentStatus} to ${newStatus}`
    );

    // Send automated push notification to student
    try {
      const statusMessages = {
        'APPROVED': 'Your order has been approved! 🎉',
        'PREPARING': 'Your order is now being prepared 👨‍🍳',
        'READY': 'Your order is ready for pickup! 🍽️',
        'SERVED': 'Your order has been served. Thank you! ✅',
        'CANCELLED': 'Your order has been cancelled'
      }

      const statusDescriptions = {
        'APPROVED': 'Your order has been approved and will be prepared soon.',
        'PREPARING': 'Your order is now being prepared in the kitchen.',
        'READY': 'Your order is ready for pickup! Please collect it from the food counter.',
        'SERVED': 'Your order has been served successfully. Thank you for using our service!',
        'CANCELLED': 'Your order has been cancelled. If you have any questions, please contact support.'
      }

      const title = statusMessages[newStatus as keyof typeof statusMessages] || 'Order Status Update'
      const body = statusDescriptions[newStatus as keyof typeof statusDescriptions] || 'Your order status has been updated.'

      const notificationResult = await sendNotificationToUser(updatedOrder.user.id, {
        title,
        body,
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-192x192.png',
        data: {
          orderId: updatedOrder.id,
          orderNumber: existingOrder.orderNumber,
          status: newStatus,
          url: `/student/orders/${existingOrder.orderNumber}`,
          timestamp: Date.now()
        }
      })

      console.log('📱 MANAGER NOTIFICATION SENT:', {
        manager: currentUser.name,
        orderId: updatedOrder.id,
        orderNumber: existingOrder.orderNumber,
        studentName: existingOrder.user.name,
        statusChange: `${currentStatus} → ${newStatus}`,
        sent: notificationResult.sent || 0,
        total: notificationResult.total || 0,
        success: notificationResult.success
      })
    } catch (notificationError) {
      console.error('❌ Failed to send manager notification:', notificationError)
      // Don't fail the order update if notification fails
    }

    return NextResponse.json({
      success: true,
      order: updatedOrder,
      message: `Order ${newStatus.toLowerCase()} successfully`,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Invalid request data',
          details: error.issues,
        },
        { status: 400 }
      );
    }

    console.error('Manager order update API error:', error);
    return NextResponse.json(
      { error: 'Failed to update order status' },
      { status: 500 }
    );
  }
}
