import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'MANAGER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, role: true, universityId: true }
    })

    if (!currentUser || !currentUser.universityId) {
      return NextResponse.json({ error: 'Manager university not found' }, { status: 404 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const search = searchParams.get('search')

    // Build where clause
    const whereClause: any = {
      universityId: currentUser.universityId
    }

    if (status) {
      whereClause.status = status
    }

    if (search) {
      whereClause.OR = [
        { orderNumber: { contains: search, mode: 'insensitive' } },
        { user: { name: { contains: search, mode: 'insensitive' } } },
        { user: { email: { contains: search, mode: 'insensitive' } } },
        { user: { studentId: { contains: search, mode: 'insensitive' } } }
      ]
    }

    // Fetch orders and total count in parallel
    const [orders, totalCount] = await Promise.all([
      prisma.order.findMany({
        where: whereClause,
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
                  name: true,
                  categories: true
                }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.order.count({ where: whereClause })
    ])

    // Get summary statistics
    const summaryStats = await prisma.order.groupBy({
      by: ['status'],
      where: { universityId: currentUser.universityId },
      _count: true
    })

    const summary = {
      total: await prisma.order.count({ where: { universityId: currentUser.universityId } }),
      pending: summaryStats.find(s => s.status === 'PENDING')?._count || 0,
      approved: summaryStats.find(s => s.status === 'APPROVED')?._count || 0,
      preparing: summaryStats.find(s => s.status === 'PREPARING')?._count || 0,
      ready: summaryStats.find(s => s.status === 'READY')?._count || 0,
      served: summaryStats.find(s => s.status === 'SERVED')?._count || 0,
      cancelled: summaryStats.find(s => s.status === 'CANCELLED')?._count || 0
    }

    return NextResponse.json({
      orders: orders.map(order => ({
        ...order,
        orderItems: order.orderItems.map(item => ({
          ...item,
          menuItem: {
            name: item.menuItem.name,
            category: item.menuItem.categories?.[0] || 'GENERAL'
          }
        }))
      })),
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit)
      },
      summary
    }, {
      headers: {
        'Cache-Control': 's-maxage=30, stale-while-revalidate=60'
      }
    })

  } catch (error) {
    console.error('Manager orders API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    )
  }
} 