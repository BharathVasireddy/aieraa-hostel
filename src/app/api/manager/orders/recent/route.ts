import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get current user with university info
    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        role: true,
        universityId: true,
      },
    });

    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if user is a manager
    if (currentUser.role !== 'MANAGER') {
      return NextResponse.json(
        { error: 'Access denied. Manager role required.' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const universityId = searchParams.get('universityId');
    const limit = parseInt(searchParams.get('limit') || '5');

    // Validate university ID matches user's university
    if (universityId && universityId !== currentUser.universityId) {
      return NextResponse.json(
        { error: 'Access denied to other universities' },
        { status: 403 }
      );
    }

    const targetUniversityId = universityId || currentUser.universityId;

    // Fetch recent orders with optimized query
    const recentOrders = await prisma.order.findMany({
      where: {
        universityId: targetUniversityId,
      },
      select: {
        id: true,
        orderNumber: true,
        totalAmount: true,
        status: true,
        createdAt: true,
        user: {
          select: {
            name: true,
            email: true,
          },
        },
        orderItems: {
          select: {
            id: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: Math.min(limit, 20), // Cap at 20 orders maximum
    });

    // Transform the data for frontend consumption
    const transformedOrders = recentOrders.map(order => ({
      id: order.id,
      orderNumber: order.orderNumber,
      studentName: order.user.name,
      totalAmount: order.totalAmount,
      status: order.status,
      createdAt: order.createdAt.toISOString(),
      itemsCount: order.orderItems.length,
    }));

    const response = {
      orders: transformedOrders,
      total: transformedOrders.length,
      lastUpdated: new Date().toISOString(),
    };

    // Cache for 30 seconds (more real-time for orders)
    const responseObj = NextResponse.json(response);
    responseObj.headers.set(
      'Cache-Control',
      'public, s-maxage=30, stale-while-revalidate=15'
    );

    return responseObj;
  } catch (error) {
    console.error('Manager recent orders API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch recent orders' },
      { status: 500 }
    );
  }
}
