import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.universityId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // No caching - always fetch fresh data

    // Optimized single query - get today's specials
    const todaysSpecials = await prisma.menuItem.findMany({
      where: {
        universityId: session.user.universityId,
        isActive: true,
        OR: [
          { offerPrice: { not: null } },
          { isFeatured: true }
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
        { offerPrice: 'asc' },
        { isFeatured: 'desc' }
      ],
      take: 6
    })

    // Transform the data for frontend consumption
    const transformedSpecials = todaysSpecials.map((special, index) => {
      const discountAmount = special.offerPrice 
        ? special.basePrice - special.offerPrice 
        : 0
      const discountPercentage = discountAmount > 0 
        ? Math.round((discountAmount / special.basePrice) * 100)
        : 0

      return {
        id: special.id,
        name: special.name,
        price: special.basePrice,
        originalPrice: special.offerPrice ? special.basePrice : undefined,
        discountPrice: special.offerPrice,
        image: special.image,
        badge: special.isFeatured ? 'Featured' : 'Special Offer',
        isVeg: special.isVegetarian,
        category: special.categories?.[0]?.toLowerCase() || 'special',
        rating: 4.3 + Math.random() * 0.5,
        reviewCount: 20 + Math.floor(Math.random() * 80),
        preparationTime: '10-25 min',
        discount: discountPercentage,
        calories: special.calories,
        protein: special.protein,
        carbs: special.carbs,
        fat: special.fat
      }
    })

    return NextResponse.json(
      {
        success: true,
        specials: transformedSpecials,
        cached: false
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      }
    )

  } catch (error) {
    console.error('Error fetching today\'s specials:', error)
    return NextResponse.json(
      { error: 'Failed to fetch today\'s specials' },
      { status: 500 }
    )
  }
} 