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

    // Get today's specials - items with offer prices or marked as featured
    const todaysSpecials = await prisma.menuItem.findMany({
      where: {
        universityId: session.user.universityId,
        isActive: true,
        OR: [
          { offerPrice: { not: null } }, // Items with offer prices
          { isFeatured: true } // Featured items (if you have this field)
        ]
      },
      orderBy: [
        { isFeatured: 'desc' }, // Featured items first
        { createdAt: 'desc' } // Then by newest
      ],
      take: 4 // Limit to 4 specials
    })

    // Transform the data for frontend consumption
    const transformedSpecials = todaysSpecials.map(dish => {
      const hasOffer = dish.offerPrice && dish.offerPrice < dish.basePrice
      
      return {
        id: dish.id,
        name: dish.name,
        description: dish.description,
        basePrice: dish.basePrice,
        offerPrice: dish.offerPrice,
        image: dish.image,
        isVegetarian: dish.isVegetarian,
        isVegan: dish.isVegan,
        categories: dish.categories,
        hasOffer
      }
    })

    return NextResponse.json({
      success: true,
      specials: transformedSpecials
    })

  } catch (error) {
    console.error('Error fetching today\'s specials:', error)
    return NextResponse.json(
      { error: 'Failed to fetch today\'s specials' },
      { status: 500 }
    )
  }
} 