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
        university: {
          select: {
            name: true,
          },
        },
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

    // Validate university ID matches user's university
    if (universityId && universityId !== currentUser.universityId) {
      return NextResponse.json(
        { error: 'Access denied to other universities' },
        { status: 403 }
      );
    }

    const targetUniversityId = universityId || currentUser.universityId;

    // Get today's date
    const today = new Date();
    const startOfToday = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    );
    const endOfToday = new Date(
      startOfToday.getTime() + 24 * 60 * 60 * 1000 - 1
    );

    // Get week start (Monday)
    const weekStart = new Date(today);
    const dayOfWeek = today.getDay();
    const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    weekStart.setDate(today.getDate() - daysFromMonday);
    weekStart.setHours(0, 0, 0, 0);

    // Get month start
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

    // Parallel queries for better performance
    const [
      todaysOrders,
      pendingOrders,
      todaysRevenue,
      activeStudents,
      weeklyOrders,
      monthlyRevenue,
    ] = await Promise.all([
      // Today's orders count
      prisma.order.count({
        where: {
          universityId: targetUniversityId,
          createdAt: {
            gte: startOfToday,
            lte: endOfToday,
          },
        },
      }),

      // Pending approvals count
      prisma.order.count({
        where: {
          universityId: targetUniversityId,
          status: 'PENDING',
        },
      }),

      // Today's revenue
      prisma.order.aggregate({
        where: {
          universityId: targetUniversityId,
          createdAt: {
            gte: startOfToday,
            lte: endOfToday,
          },
          status: {
            in: ['APPROVED', 'PREPARING', 'READY', 'SERVED'],
          },
        },
        _sum: {
          totalAmount: true,
        },
      }),

      // Active students (approved students with orders in last 30 days)
      prisma.user.count({
        where: {
          universityId: targetUniversityId,
          role: 'STUDENT',
          status: 'APPROVED',
          orders: {
            some: {
              createdAt: {
                gte: new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000),
              },
            },
          },
        },
      }),

      // Weekly orders for growth calculation
      prisma.order.count({
        where: {
          universityId: targetUniversityId,
          createdAt: {
            gte: weekStart,
          },
        },
      }),

      // Monthly revenue
      prisma.order.aggregate({
        where: {
          universityId: targetUniversityId,
          createdAt: {
            gte: monthStart,
          },
          status: {
            in: ['APPROVED', 'PREPARING', 'READY', 'SERVED'],
          },
        },
        _sum: {
          totalAmount: true,
        },
      }),
    ]);

    // Calculate previous week for growth
    const prevWeekStart = new Date(
      weekStart.getTime() - 7 * 24 * 60 * 60 * 1000
    );
    const prevWeekOrders = await prisma.order.count({
      where: {
        universityId: targetUniversityId,
        createdAt: {
          gte: prevWeekStart,
          lt: weekStart,
        },
      },
    });

    // Calculate weekly growth percentage
    const weeklyGrowth =
      prevWeekOrders > 0
        ? Math.round(((weeklyOrders - prevWeekOrders) / prevWeekOrders) * 100)
        : weeklyOrders > 0
          ? 100
          : 0;

    const response = {
      todaysOrders,
      pendingApprovals: pendingOrders,
      todaysRevenue: todaysRevenue._sum.totalAmount || 0,
      activeStudents,
      weeklyGrowth,
      monthlyRevenue: monthlyRevenue._sum.totalAmount || 0,
      universityName: currentUser.university?.name,
      lastUpdated: new Date().toISOString(),
    };

    // Cache for 1 minute
    const responseObj = NextResponse.json(response);
    responseObj.headers.set(
      'Cache-Control',
      'public, s-maxage=60, stale-while-revalidate=30'
    );

    return responseObj;
  } catch (error) {
    console.error('Manager stats API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch manager statistics' },
      { status: 500 }
    );
  }
}
