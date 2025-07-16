import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { lightningCache } from '@/lib/cache'

// Cache popular dishes for 5 minutes to avoid heavy queries
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes
let cachedData: any = null
let cacheTimestamp = 0

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.universityId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const now = Date.now()
    const cacheKey = `popular_dishes_${session.user.universityId}`
    
    // Check instant cache first for immediate response
    const instantCached = lightningCache.getInstant(cacheKey)
    if (instantCached) {
      return NextResponse.json({
        success: true,
        dishes: instantCached,
        cached: true
      })
    }
    
    // Return memory cache if still valid
    if (cachedData && cacheTimestamp && (now - cacheTimestamp) < CACHE_DURATION) {
      lightningCache.setInstant(cacheKey, cachedData) // Store in instant cache too
      return NextResponse.json({
        success: true,
        dishes: cachedData,
        cached: true
      })
    }

    // Lightning-fast query - prioritize featured items first, then low-priced items
    // Split query to use indexes efficiently
    const [featuredItems, affordableItems] = await Promise.all([
      // Get featured items (uses isFeatured index)
      prisma.menuItem.findMany({
        where: {
          universityId: session.user.universityId,
          isActive: true,
          isFeatured: true
        },
        select: {
          id: true,
          name: true,
          description: true,
          basePrice: true,
          offerPrice: true,
          image: true,
          isVegetarian: true,
          isVegan: true,
          isFeatured: true,
          categories: true,
          calories: true,
          protein: true,
          carbs: true,
          fat: true
        },
        orderBy: { basePrice: 'asc' },
        take: 5
      }),
      // Get affordable items if we need more (uses price index)
      prisma.menuItem.findMany({
        where: {
          universityId: session.user.universityId,
          isActive: true,
          isFeatured: false,
          basePrice: { lte: 150 }
        },
        select: {
          id: true,
          name: true,
          description: true,
          basePrice: true,
          offerPrice: true,
          image: true,
          isVegetarian: true,
          isVegan: true,
          isFeatured: true,
          categories: true,
          calories: true,
          protein: true,
          carbs: true,
          fat: true
        },
        orderBy: { basePrice: 'asc' },
        take: 3
      })
    ])

    // Combine results
    const popularDishes = [...featuredItems, ...affordableItems].slice(0, 8)

    // Transform the data for frontend consumption
    const transformedDishes = popularDishes.map(dish => ({
      id: dish.id,
      name: dish.name,
      description: dish.description,
      price: dish.offerPrice || dish.basePrice,
      offerPrice: dish.offerPrice,
      image: dish.image,
      orders: dish.isFeatured ? 50 : 25, // Mock order count for UI
      isVeg: dish.isVegetarian,
      category: dish.categories?.[0]?.toLowerCase() || 'snacks',
      rating: 4.2 + Math.random() * 0.6, // Mock rating for UI
      reviewCount: 15 + Math.floor(Math.random() * 85),
      preparationTime: '15-20 min',
      calories: dish.calories,
      protein: dish.protein,
      carbs: dish.carbs,
      fat: dish.fat
    }))

    // Update caches
    cachedData = transformedDishes
    cacheTimestamp = now
    lightningCache.setInstant(cacheKey, transformedDishes) // Store in instant cache

    return NextResponse.json({
      success: true,
      dishes: transformedDishes,
      cached: false
    })

  } catch (error) {
    console.error('Error fetching popular dishes:', error)
    return NextResponse.json(
      { error: 'Failed to fetch popular dishes' },
      { status: 500 }
    )
  }
} 