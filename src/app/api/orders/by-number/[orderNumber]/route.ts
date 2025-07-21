import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orderNumber: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { orderNumber } = await params;

    console.log(
      'API: Fetching order with number:',
      orderNumber,
      'for user:',
      session.user.id
    );

    // Fetch the order with all related data using orderNumber
    const order = await prisma.order.findFirst({
      where: {
        orderNumber: orderNumber,
        userId: session.user.id, // Ensure user can only access their own orders
      },
      include: {
        orderItems: {
          include: {
            menuItem: {
              select: {
                id: true,
                name: true,
                categories: true,
                image: true,
                isVegetarian: true,
                isVegan: true,
              },
            },
            variant: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            roomNumber: true,
            studentId: true,
            university: {
              select: {
                name: true,
                address: true,
              },
            },
          },
        },
      },
    });

    if (!order) {
      // Let's check if the order exists at all (ignoring userId constraint)
      const orderExists = await prisma.order.findUnique({
        where: { orderNumber: orderNumber },
        select: { id: true, userId: true, orderNumber: true },
      });

      console.log('API: Order exists check by number:', orderExists);
      console.log('API: Current session user ID:', session.user.id);

      return NextResponse.json(
        {
          error:
            'Order not found or you do not have permission to view this order',
        },
        { status: 404 }
      );
    }

    console.log(
      'API: Order found successfully by number:',
      order.orderNumber,
      'for user:',
      order.userId
    );

    // Transform the data to match the expected format
    const transformedOrder = {
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      paymentStatus: order.paymentStatus,
      totalAmount: order.totalAmount,
      subtotalAmount: order.subtotalAmount || order.totalAmount,
      taxAmount: order.taxAmount || 0,
      orderDate: order.orderDate,
      createdAt: order.createdAt,
      completedAt: order.completedAt,
      specialInstructions: order.specialInstructions,
      // Transform orderItems to items array as expected by frontend
      items: order.orderItems.map(item => ({
        id: item.id,
        name: item.menuItem.name,
        quantity: item.quantity,
        price: item.price,
        variant: item.variant
          ? {
              name: item.variant.name,
            }
          : undefined,
        menuItem: {
          image: item.menuItem.image,
          isVegetarian: item.menuItem.isVegetarian || false,
          isVegan: item.menuItem.isVegan || false,
        },
      })),
    };

    return NextResponse.json(transformedOrder);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: 'Failed to fetch order details' },
      { status: 500 }
    );
  }
}
