import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { startOfDay, endOfDay, subDays, format, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    console.log('📊 Analytics API called')
    
    const session = await getServerSession(authOptions)
    
    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'MANAGER')) {
      console.log('❌ Analytics: No session found or insufficient permissions')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('👤 Analytics: User authenticated:', session.user.email)

    // Get current user with university info
    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { university: true }
    })

    if (!currentUser) {
      console.log('❌ Analytics: User not found in database')
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    console.log('🎯 Analytics: User role:', currentUser.role, 'University:', currentUser.university?.name)

    // Check if user has admin privileges (ADMIN or MANAGER)
    if (!['ADMIN', 'MANAGER'].includes(currentUser.role)) {
      console.log('❌ Analytics: Insufficient permissions for role:', currentUser.role)
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Get period from query params
    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || 'week'

    // Calculate date range based on period
    let startDate: Date, endDate: Date, previousStartDate: Date, previousEndDate: Date
    const now = new Date()

    switch (period) {
      case 'day':
        startDate = startOfDay(now)
        endDate = endOfDay(now)
        previousStartDate = startOfDay(subDays(now, 1))
        previousEndDate = endOfDay(subDays(now, 1))
        break
      case 'week':
        startDate = startOfWeek(now)
        endDate = endOfWeek(now)
        previousStartDate = startOfWeek(subDays(now, 7))
        previousEndDate = endOfWeek(subDays(now, 7))
        break
      case 'month':
        startDate = startOfMonth(now)
        endDate = endOfMonth(now)
        previousStartDate = startOfMonth(subDays(now, 30))
        previousEndDate = endOfMonth(subDays(now, 30))
        break
      default:
        startDate = startOfWeek(now)
        endDate = endOfWeek(now)
        previousStartDate = startOfWeek(subDays(now, 7))
        previousEndDate = endOfWeek(subDays(now, 7))
    }

    // Build where clause based on role
    const whereClause: any = {}
    
    // MANAGER can only see data from their university
    // ADMIN can see data from all universities
    if (currentUser.role === 'MANAGER') {
      whereClause.universityId = currentUser.universityId
    }

    // Current period where clause
    const currentPeriodWhere = {
      ...whereClause,
      createdAt: {
        gte: startDate,
        lte: endDate
      }
    }

    // Previous period where clause
    const previousPeriodWhere = {
      ...whereClause,
      createdAt: {
        gte: previousStartDate,
        lte: previousEndDate
      }
    }

    // Get current period data
    const [
      currentOrders,
      currentRevenue,
      previousOrders,
      previousRevenue,
      totalStudents,
      activeStudents,
      popularItems,
      categoryBreakdown,
      orderStatusStats,
      allOrders
    ] = await Promise.all([
      // Current period orders
      prisma.order.findMany({
        where: currentPeriodWhere,
        select: {
          id: true,
          totalAmount: true,
          status: true,
          createdAt: true,
          orderItems: {
            select: {
              quantity: true,
              price: true,
              menuItem: {
                select: {
                  id: true,
                  name: true,
                  categories: true
                }
              }
            }
          }
        }
      }),

      // Current period revenue
      prisma.order.aggregate({
        where: {
          ...currentPeriodWhere,
          status: 'SERVED'
        },
        _sum: {
          totalAmount: true
        }
      }),

      // Previous period orders
      prisma.order.count({
        where: previousPeriodWhere
      }),

      // Previous period revenue
      prisma.order.aggregate({
        where: {
          ...previousPeriodWhere,
          status: 'SERVED'
        },
        _sum: {
          totalAmount: true
        }
      }),

      // Total students count
      prisma.user.count({
        where: {
          ...(currentUser.role === 'MANAGER' ? { universityId: currentUser.universityId } : {}),
          role: 'STUDENT'
        }
      }),

      // Active students (with orders in current period)
      prisma.user.count({
        where: {
          ...(currentUser.role === 'MANAGER' ? { universityId: currentUser.universityId } : {}),
          role: 'STUDENT',
          orders: {
            some: {
              createdAt: {
                gte: startDate,
                lte: endDate
              }
            }
          }
        }
      }),

      // Popular items
      prisma.orderItem.groupBy({
        by: ['menuItemId'],
        where: {
          order: currentPeriodWhere
        },
        _sum: {
          quantity: true,
          price: true
        },
        _count: {
          id: true
        },
        orderBy: {
          _sum: {
            quantity: 'desc'
          }
        },
        take: 10
      }),

      // Category breakdown
      prisma.order.findMany({
        where: currentPeriodWhere,
        select: {
          orderItems: {
            select: {
              menuItem: {
                select: {
                  categories: true
                }
              }
            }
          }
        }
      }),

      // Order status stats
      prisma.order.groupBy({
        by: ['status'],
        where: currentPeriodWhere,
        _count: {
          id: true
        },
        _sum: {
          totalAmount: true
        }
      }),

      // All orders for daily breakdown
      prisma.order.findMany({
        where: currentPeriodWhere,
        select: {
          createdAt: true,
          totalAmount: true,
          status: true
        },
        orderBy: {
          createdAt: 'asc'
        }
      })
    ])

    // Calculate growth rates
    const currentTotalRevenue = currentRevenue._sum.totalAmount || 0
    const previousTotalRevenue = previousRevenue._sum.totalAmount || 0
    const revenueGrowth = previousTotalRevenue > 0 
      ? ((currentTotalRevenue - previousTotalRevenue) / previousTotalRevenue) * 100 
      : 0

    const orderGrowth = previousOrders > 0 
      ? ((currentOrders.length - previousOrders) / previousOrders) * 100 
      : 0

    // Calculate average order value
    const avgOrderValue = currentOrders.length > 0 ? currentTotalRevenue / currentOrders.length : 0

    // Calculate success rate
    const successfulOrders = currentOrders.filter(order => order.status === 'SERVED').length
    const orderSuccessRate = currentOrders.length > 0 ? (successfulOrders / currentOrders.length) * 100 : 0

    // Generate daily data
    const dailyData = []
    const days = period === 'day' ? 1 : period === 'week' ? 7 : 30
    
    for (let i = 0; i < days; i++) {
      const date = new Date(startDate)
      date.setDate(startDate.getDate() + i)
      
      if (date > endDate) break
      
      const dayOrders = allOrders.filter(order => {
        const orderDate = new Date(order.createdAt)
        return orderDate.toDateString() === date.toDateString()
      })
      
      const dayRevenue = dayOrders
        .filter(order => order.status === 'SERVED')
        .reduce((sum, order) => sum + order.totalAmount, 0)
      
      dailyData.push({
        date: format(date, 'yyyy-MM-dd'),
        dayName: format(date, period === 'day' ? 'HH:mm' : 'EEE'),
        revenue: dayRevenue,
        orders: dayOrders.length
      })
    }

    // Get menu item details for popular items
    const menuItemIds = popularItems.map(item => item.menuItemId)
    const menuItemDetails = menuItemIds.length > 0 ? await prisma.menuItem.findMany({
      where: {
        id: {
          in: menuItemIds
        }
      },
      select: {
        id: true,
        name: true,
        categories: true
      }
    }) : []

    // Format popular items
    const formattedPopularItems = popularItems.map(item => {
      const menuItem = menuItemDetails.find(mi => mi.id === item.menuItemId)
      return {
        id: item.menuItemId,
        name: menuItem?.name || 'Unknown Item',
        category: menuItem?.categories?.[0] || 'UNKNOWN',
        orders: item._count.id,
        quantity: item._sum.quantity || 0,
        revenue: item._sum.price || 0
      }
    })

    // Calculate category breakdown
    const categoryMap = new Map()
    categoryBreakdown.forEach(order => {
      order.orderItems.forEach(orderItem => {
        const categories = orderItem.menuItem.categories || []
        categories.forEach(category => {
          categoryMap.set(category, (categoryMap.get(category) || 0) + 1)
        })
      })
    })

    const formattedCategoryBreakdown = Array.from(categoryMap.entries()).map(([category, count]) => ({
      category,
      _count: count
    }))

    // Student segments (simplified)
    const studentSegments = {
      heavy: { count: Math.floor(activeStudents * 0.1), avgSpend: avgOrderValue * 3 },
      regular: { count: Math.floor(activeStudents * 0.3), avgSpend: avgOrderValue * 1.5 },
      occasional: { count: Math.floor(activeStudents * 0.4), avgSpend: avgOrderValue * 0.8 },
      new: { count: Math.floor(activeStudents * 0.2), avgSpend: avgOrderValue * 0.5 }
    }

    const analyticsData = {
      period,
      dateRange: {
        start: format(startDate, 'yyyy-MM-dd'),
        end: format(endDate, 'yyyy-MM-dd')
      },
      keyMetrics: {
        totalRevenue: currentTotalRevenue,
        revenueGrowth,
        totalOrders: currentOrders.length,
        orderGrowth,
        avgOrderValue,
        activeStudents,
        totalStudents,
        orderSuccessRate
      },
      dailyData,
      popularItems: formattedPopularItems,
      categoryBreakdown: formattedCategoryBreakdown,
      orderStatusStats,
      studentSegments
    }

    console.log('✅ Analytics: Successfully calculated analytics data')
    
    return NextResponse.json(analyticsData)
    
  } catch (error) {
    console.error('❌ Analytics API Error:')
    console.error('Error message:', error instanceof Error ? error.message : String(error))
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    console.error('Full error:', error)
    
    return NextResponse.json(
      { error: 'Failed to fetch analytics data' },
      { status: 500 }
    )
  }
} 