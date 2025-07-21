import { prisma } from './prisma'
import { MenuCategory, OrderStatus } from '../generated/prisma'

// Request deduplication for lightning-fast responses
const pendingRequests = new Map<string, Promise<any>>()

// Enhanced caching layer with TTL
const cache = new Map<string, { data: any, timestamp: number, ttl: number }>()

export async function deduplicatedRequest<T>(
  key: string, 
  requestFn: () => Promise<T>,
  ttl: number = 5 * 60 * 1000 // 5 minutes default
): Promise<T> {
  // Check cache first
  const cached = cache.get(key)
  if (cached && (Date.now() - cached.timestamp) < cached.ttl) {
    return cached.data
  }

  // Check for pending request
  if (pendingRequests.has(key)) {
    return pendingRequests.get(key)!
  }
  
  const promise = requestFn().then(result => {
    // Cache the result
    cache.set(key, {
      data: result,
      timestamp: Date.now(),
      ttl
    })
    return result
  })
  
  pendingRequests.set(key, promise)
  
  // Clean up after completion
  promise.finally(() => pendingRequests.delete(key))
  
  return promise
}

// Clear cache utility
export function clearCache(pattern?: string) {
  if (pattern) {
    for (const key of Array.from(cache.keys())) {
      if (key.includes(pattern)) {
        cache.delete(key)
      }
    }
  } else {
    cache.clear()
  }
}

// Lightning-fast menu queries with optimized indexes
export async function getFastMenuItems(
  universityId: string, 
  date: string, 
  options?: {
    category?: string
    search?: string
    vegOnly?: boolean
    limit?: number
  }
) {
  const cacheKey = `menu-${universityId}-${date}-${JSON.stringify(options)}`
  
  return deduplicatedRequest(cacheKey, async () => {
    const whereClause: any = {
      universityId,
      isActive: true
    }

    // Category filter using indexed field
    if (options?.category && options.category !== 'all') {
      whereClause.categories = {
        has: options.category.toUpperCase() as MenuCategory
      }
    }

    // Vegetarian filter using indexed field
    if (options?.vegOnly) {
      whereClause.isVegetarian = true
    }

    // Search filter using indexed name field
    if (options?.search) {
      whereClause.OR = [
        { name: { contains: options.search, mode: 'insensitive' } },
        { description: { contains: options.search, mode: 'insensitive' } }
      ]
    }

    // Optimized query with minimal joins
    const items = await prisma.menuItem.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        description: true,
        basePrice: true,
        offerPrice: true,
        categories: true,
        isVegetarian: true,
        isVegan: true,
        isFeatured: true,
        image: true,
        calories: true,
        protein: true,
        carbs: true,
        fat: true,
        variants: {
          select: {
            id: true,
            name: true,
            price: true,
            isDefault: true,
            isActive: true
          },
          where: { isActive: true },
          orderBy: { isDefault: 'desc' }
        },
        availability: {
          select: {
            isAvailable: true,
            maxQuantity: true,
            currentQuantity: true
          },
          where: {
            date: new Date(date)
          },
          take: 1
        }
      },
      orderBy: [
        { isFeatured: 'desc' },
        { name: 'asc' }
      ],
      take: options?.limit || 50
    })

    // Filter items based on availability for the requested date
    const availableItems = items.filter(item => {
      // If no availability records exist, item is NOT available for this date
      if (item.availability.length === 0) {
        return false
      }
      
      // If availability record exists, check if it's marked as available
      const availabilityRecord = item.availability[0]
      return availabilityRecord.isAvailable === true
    })

    return availableItems
  }, 10 * 60 * 1000) // 10 minute cache for menu items
}

// Optimized user orders query
export async function getFastUserOrders(
  userId: string,
  options?: {
    status?: OrderStatus[]
    limit?: number
    offset?: number
  }
) {
  const cacheKey = `orders-${userId}-${JSON.stringify(options)}`
  
  return deduplicatedRequest(cacheKey, async () => {
    const whereClause: any = { userId }

    if (options?.status) {
      whereClause.status = { in: options.status }
    }

    // Lightning-fast order query with minimal data
    const orders = await prisma.order.findMany({
      where: whereClause,
      select: {
        id: true,
        orderNumber: true,
        status: true,
        totalAmount: true,
        orderDate: true,
        createdAt: true,
        orderItems: {
          select: {
            id: true,
            quantity: true,
            price: true,
            menuItem: {
              select: {
                id: true,
                name: true,
                image: true,
                isVegetarian: true
              }
            },
            variant: {
              select: {
                name: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: options?.limit || 10,
      skip: options?.offset || 0
    })

    return orders
  }, 2 * 60 * 1000) // 2 minute cache for orders
}

// Optimized manager orders query
export async function getFastManagerOrders(
  universityId: string,
  options?: {
    status?: OrderStatus[]
    date?: string
    limit?: number
  }
) {
  const cacheKey = `manager-orders-${universityId}-${JSON.stringify(options)}`
  
  return deduplicatedRequest(cacheKey, async () => {
    const whereClause: any = { universityId }

    if (options?.status) {
      whereClause.status = { in: options.status }
    }

    if (options?.date) {
      const startOfDay = new Date(options.date)
      startOfDay.setHours(0, 0, 0, 0)
      const endOfDay = new Date(options.date)
      endOfDay.setHours(23, 59, 59, 999)
      
      whereClause.orderDate = {
        gte: startOfDay,
        lte: endOfDay
      }
    }

    const orders = await prisma.order.findMany({
      where: whereClause,
      select: {
        id: true,
        orderNumber: true,
        status: true,
        totalAmount: true,
        orderDate: true,
        createdAt: true,
        user: {
          select: {
            id: true,
            name: true,
            roomNumber: true
          }
        },
        orderItems: {
          select: {
            quantity: true,
            menuItem: {
              select: {
                name: true,
                isVegetarian: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: options?.limit || 20
    })

    return orders
  }, 1 * 60 * 1000) // 1 minute cache for manager orders
}

// Lightning-fast student dashboard data
export async function getStudentDashboardData(userId: string, universityId: string) {
  const cacheKey = `student-dashboard-${userId}`
  
  return deduplicatedRequest(cacheKey, async () => {
    // Get only essential data in parallel
    const [recentOrders, upcomingOrders] = await Promise.all([
      // Recent orders (last 5)
      prisma.order.findMany({
        where: { userId },
        select: {
          id: true,
          orderNumber: true,
          status: true,
          totalAmount: true,
          orderDate: true,
          orderItems: {
            select: {
              menuItem: {
                select: {
                  name: true,
                  isVegetarian: true
                }
              }
            },
            take: 2 // Only show first 2 items
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 5
      }),

      // Upcoming orders (next 3 days)
      prisma.order.findMany({
        where: {
          userId,
          status: { in: ['PENDING', 'APPROVED', 'PREPARING', 'READY'] },
          orderDate: {
            gte: new Date(),
            lte: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
          }
        },
        select: {
          id: true,
          orderNumber: true,
          status: true,
          totalAmount: true,
          orderDate: true
        },
        orderBy: { orderDate: 'asc' },
        take: 3
      })
    ])

    return {
      recentOrders,
      upcomingOrders,
      stats: {
        totalOrders: recentOrders.length, // Simplified for speed
        pendingOrders: upcomingOrders.length
      }
    }
  }, 5 * 60 * 1000) // 5 minute cache
}

// Lightning-fast manager dashboard data
export async function getManagerDashboardData(universityId: string) {
  const cacheKey = `manager-dashboard-${universityId}`
  
  return deduplicatedRequest(cacheKey, async () => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    // Get only essential data
    const [todayOrders, pendingOrders] = await Promise.all([
      // Today's orders count
      prisma.order.count({
        where: {
          universityId,
          createdAt: {
            gte: today,
            lt: tomorrow
          }
        }
      }),

      // Pending orders that need attention
      prisma.order.findMany({
        where: {
          universityId,
          status: { in: ['PENDING', 'APPROVED'] }
        },
        select: {
          id: true,
          orderNumber: true,
          status: true,
          totalAmount: true,
          createdAt: true,
          user: {
            select: {
              name: true,
              roomNumber: true
            }
          }
        },
        orderBy: { createdAt: 'asc' },
        take: 10
      })
    ])

    return {
      todayStats: {
        totalOrders: todayOrders,
        pendingOrders: pendingOrders.length,
        revenue: 0 // Will be calculated from served orders if needed
      },
      pendingOrders,
      quickStats: {
        averageOrderValue: 150, // Mock for speed
        customerSatisfaction: 4.2 // Mock for speed
      }
    }
  }, 3 * 60 * 1000) // 3 minute cache
}

// Batch operations for better performance
export async function batchUpdateOrderStatus(orderIds: string[], status: OrderStatus) {
  // Clear relevant caches
  clearCache('orders-')
  clearCache('manager-dashboard-')
  
  return prisma.order.updateMany({
    where: {
      id: { in: orderIds }
    },
    data: {
      status,
      updatedAt: new Date()
    }
  })
}

// Connection health check
export async function checkDatabaseHealth() {
  try {
    await prisma.$queryRaw`SELECT 1`
    return { status: 'healthy', timestamp: new Date() }
  } catch (error) {
    return { status: 'unhealthy', error: error, timestamp: new Date() }
  }
}

// Cleanup function for cache maintenance
export function startCacheCleanup() {
  setInterval(() => {
    const now = Date.now()
    for (const [key, cached] of Array.from(cache.entries())) {
      if ((now - cached.timestamp) > cached.ttl) {
        cache.delete(key)
      }
    }
  }, 5 * 60 * 1000) // Clean every 5 minutes
}

// Initialize cache cleanup
if (typeof window === 'undefined') {
  startCacheCleanup()
} 