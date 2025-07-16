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

    const cacheKey = `todays_specials_${session.user.universityId}`
    
    // Check cache first
    const cachedData = cache.get(cacheKey)
    if (cachedData) {
      return NextResponse.json({
        success: true,
        specials: cachedData,
        cached: true
      })
    }

    // Get today's specials from database
    const specialItems = await prisma.menuItem.findMany({
      where: {
        universityId: session.user.universityId,
        isActive: true,
        AND: [
          { 
            OR: [
              { isFeatured: true },
              { offerPrice: { not: null } },
              { basePrice: { lte: 200 } }
            ]
          }
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
        { offerPrice: 'asc' },
        { basePrice: 'asc' }
      ],
      take: 6
    })

    // Transform the data for frontend consumption
    const transformedSpecials = specialItems.map(item => {
      const hasDiscount = item.offerPrice && item.offerPrice < item.basePrice
      const discountPercentage = hasDiscount 
        ? Math.round(((item.basePrice - item.offerPrice!) / item.basePrice) * 100)
        : 0

      return {
        id: item.id,
        name: item.name,
        description: item.description,
        originalPrice: hasDiscount ? item.basePrice : undefined,
        discountPrice: item.offerPrice,
        price: item.offerPrice || item.basePrice,
        image: item.image,
        badge: item.isFeatured 
          ? 'Featured' 
          : hasDiscount 
            ? `${discountPercentage}% OFF`
            : 'Special',
        isVeg: item.isVegetarian,
        category: item.categories?.[0]?.toLowerCase() || 'specials',
        discount: discountPercentage,
        rating: 4.0 + Math.random() * 0.8, // Mock rating for UI
        reviewCount: 10 + Math.floor(Math.random() * 90),
        preparationTime: '12-18 min',
        calories: item.calories,
        protein: item.protein,
        carbs: item.carbs,
        fat: item.fat
      }
    })

    // Cache for 10 minutes (specials change less frequently)
    cache.set(cacheKey, transformedSpecials, 10)

    return NextResponse.json({
      success: true,
      specials: transformedSpecials,
      cached: false
    })

  } catch (error) {
    console.error('Error fetching today\'s specials:', error)
    return NextResponse.json(
      { error: 'Failed to fetch today\'s specials' },
      { status: 500 }
    )
  }
} 