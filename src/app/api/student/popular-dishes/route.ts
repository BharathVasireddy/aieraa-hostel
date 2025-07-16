import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { cache } from '@/lib/cache'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.universityId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const cacheKey = `popular_dishes_${session.user.universityId}`
    
    // Check cache first
    const cachedData = cache.get(cacheKey)
    if (cachedData) {
      return NextResponse.json({
        success: true,
        dishes: cachedData,
        cached: true
      })
    }

    // Optimized single query - get popular dishes based on featured status and price
    const popularDishes = await prisma.menuItem.findMany({
      where: {
        universityId: session.user.universityId,
        isActive: true,
        OR: [
          { isFeatured: true },
          { basePrice: { lte: 150 } }
        ]
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
      orderBy: [
        { isFeatured: 'desc' },
        { basePrice: 'asc' }
      ],
      take: 8
    })

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

    // Cache for 5 minutes
    cache.set(cacheKey, transformedDishes, 5)

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