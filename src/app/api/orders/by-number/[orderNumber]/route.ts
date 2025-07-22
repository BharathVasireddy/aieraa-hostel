import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// Get order details by order number
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orderNumber: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, role: true, universityId: true },
    });

    if (!currentUser || !currentUser.universityId) {
      return NextResponse.json(
        { error: 'User university not found' },
        { status: 404 }
      );
    }

    const resolvedParams = await params;
    const orderNumber = resolvedParams.orderNumber;

    // Get order details by order number
    const order = await prisma.order.findUnique({
      where: { orderNumber: orderNumber },
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

    // Check access permissions based on role
    if (session.user.role === 'MANAGER' || session.user.role === 'ADMIN') {
      // Managers and admins can only see orders from their university
      if (order.universityId !== currentUser.universityId) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }
    } else if (session.user.role === 'STUDENT') {
      // Students can only see their own orders
      if (order.userId !== currentUser.id) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }
    } else {
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
    console.error('Order by number API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch order details' },
      { status: 500 }
    );
  }
}
