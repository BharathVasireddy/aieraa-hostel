import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get current user with university info
    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        role: true,
        universityId: true
      }
    })

    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check if user is a manager
    if (currentUser.role !== 'MANAGER') {
      return NextResponse.json({ error: 'Access denied. Manager role required.' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const universityId = searchParams.get('universityId')
    const limit = parseInt(searchParams.get('limit') || '4')
    const period = searchParams.get('period') || 'week' // week, month

    // Validate university ID matches user's university
    if (universityId && universityId !== currentUser.universityId) {
      return NextResponse.json({ error: 'Access denied to other universities' }, { status: 403 })
    }

    const targetUniversityId = universityId || currentUser.universityId

    // Calculate date range based on period
    const today = new Date()
    let startDate: Date

    if (period === 'month') {
      startDate = new Date(today.getFullYear(), today.getMonth(), 1)
    } else {
      // Default to week
      const weekStart = new Date(today)
      const dayOfWeek = today.getDay()
      const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1
      weekStart.setDate(today.getDate() - daysFromMonday)
      weekStart.setHours(0, 0, 0, 0)
      startDate = weekStart
    }

    // Get popular menu items with order counts and revenue
    const popularItemsData = await prisma.orderItem.groupBy({
      by: ['menuItemId'],
      where: {
        order: {
          universityId: targetUniversityId,
          createdAt: {
            gte: startDate
          },
          status: {
            in: ['APPROVED', 'PREPARING', 'READY', 'SERVED']
          }
        }
      },
      _count: {
        id: true
      },
      _sum: {
        quantity: true,
        price: true
      },
      orderBy: {
        _count: {
          id: 'desc'
        }
      },
      take: Math.min(limit, 10) // Cap at 10 items maximum
    })

    // Get detailed menu item information
    const menuItemIds = popularItemsData.map(item => item.menuItemId)
    
    if (menuItemIds.length === 0) {
      return NextResponse.json({
        items: [],
        total: 0,
        period,
        lastUpdated: new Date().toISOString()
      })
    }

    const menuItems = await prisma.menuItem.findMany({
      where: {
        id: {
          in: menuItemIds
        },
        universityId: targetUniversityId
      },
      select: {
        id: true,
        name: true,
        categories: true,
        isVegetarian: true,
        basePrice: true
      }
    })

    // Create a map for quick lookup
    const menuItemMap = new Map(menuItems.map(item => [item.id, item]))

    // Transform the data for frontend consumption
    const transformedItems = popularItemsData
      .map(orderData => {
        const menuItem = menuItemMap.get(orderData.menuItemId)
        if (!menuItem) return null

        return {
          id: menuItem.id,
          name: menuItem.name,
          category: menuItem.categories[0] || 'GENERAL',
          ordersCount: orderData._count.id,
          revenue: Math.round(orderData._sum.price || 0),
          isVegetarian: menuItem.isVegetarian,
          totalQuantity: orderData._sum.quantity || 0,
          basePrice: menuItem.basePrice
        }
      })
      .filter((item): item is NonNullable<typeof item> => item !== null)

    const response = {
      items: transformedItems,
      total: transformedItems.length,
      period,
      dateRange: {
        start: startDate.toISOString(),
        end: today.toISOString()
      },
      lastUpdated: new Date().toISOString()
    }

    // Cache for 5 minutes (less frequent updates for analytics)
    const responseObj = NextResponse.json(response)
    responseObj.headers.set('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=150')
    
    return responseObj

  } catch (error) {
    console.error('Manager popular items API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch popular items' },
      { status: 500 }
    )
  }
} 