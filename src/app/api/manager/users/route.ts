import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'MANAGER') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get current user to verify university
    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, role: true, universityId: true },
    });

    if (!currentUser || !currentUser.universityId) {
      return NextResponse.json(
        { error: 'Manager university not found' },
        { status: 404 }
      );
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status'); // PENDING, APPROVED, SUSPENDED
    const role = searchParams.get('role'); // STUDENT, MANAGER, etc.
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const search = searchParams.get('search');

    // Build where clause
    const whereClause: any = {
      universityId: currentUser.universityId,
      // Exclude current user from results
      NOT: {
        id: currentUser.id,
      },
    };

    if (status) {
      whereClause.status = status;
    }

    if (role) {
      whereClause.role = role;
    }

    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { studentId: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Get users with pagination
    const [users, totalCount] = await Promise.all([
      prisma.user.findMany({
        where: whereClause,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          status: true,
          studentId: true,
          roomNumber: true,
          course: true,
          year: true,
          phone: true,
          createdAt: true,
          lastLoginAt: true,
          university: {
            select: {
              name: true,
              code: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.user.count({ where: whereClause }),
    ]);

    // Get summary stats
    const stats = await prisma.user.groupBy({
      by: ['status'],
      where: {
        universityId: currentUser.universityId,
        NOT: { id: currentUser.id },
      },
      _count: true,
    });

    const summary = {
      total: totalCount,
      pending: stats.find(s => s.status === 'PENDING')?._count || 0,
      approved: stats.find(s => s.status === 'APPROVED')?._count || 0,
      suspended: stats.find(s => s.status === 'SUSPENDED')?._count || 0,
      rejected: stats.find(s => s.status === 'REJECTED')?._count || 0,
    };

    const response = {
      users,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit),
      },
      summary,
    };

    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'private, no-cache, no-store, must-revalidate',
      },
    });
  } catch (error) {
    console.error('Manager users API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}
