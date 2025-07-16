import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { lightningCache } from '@/lib/cache'

// Cache today's specials for 10 minutes
const CACHE_DURATION = 10 * 60 * 1000 // 10 minutes
let cachedData: any = null
let cacheTimestamp = 0

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.universityId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const now = Date.now()
    const cacheKey = `todays_specials_${session.user.universityId}`
    
    // Check instant cache first for immediate response
    const instantCached = lightningCache.getInstant(cacheKey)
    if (instantCached) {
      return NextResponse.json({
        success: true,
        specials: instantCached,
        cached: true
      })
    }
    
    // Return memory cache if still valid
    if (cachedData && cacheTimestamp && (now - cacheTimestamp) < CACHE_DURATION) {
      lightningCache.setInstant(cacheKey, cachedData) // Store in instant cache too
      return NextResponse.json({
        success: true,
        specials: cachedData,
        cached: true
      })
    }

    // Lightning-fast parallel queries - split complex OR into separate indexed queries
    const [offerItems, featuredItems, budgetSnacks] = await Promise.all([
      // Items with offers (indexed on offerPrice)
      prisma.menuItem.findMany({
        where: {
          universityId: session.user.universityId,
          isActive: true,
          offerPrice: { not: null }
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
          categories: true,
          isFeatured: true
        },
        orderBy: { offerPrice: 'asc' },
        take: 3
      }),
      // Featured items (indexed on isFeatured)
      prisma.menuItem.findMany({
        where: {
          universityId: session.user.universityId,
          isActive: true,
          isFeatured: true,
          offerPrice: null // Exclude items already in offers
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
          categories: true,
          isFeatured: true
        },
        orderBy: { basePrice: 'asc' },
        take: 2
      }),
      // Budget snacks (avoid JSON array search, use price filter)
      prisma.menuItem.findMany({
        where: {
          universityId: session.user.universityId,
          isActive: true,
          basePrice: { lt: 80 }, // Budget items
          isFeatured: false,
          offerPrice: null
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
          categories: true,
          isFeatured: true
        },
        orderBy: { basePrice: 'asc' },
        take: 2
      })
    ])

    // Combine and deduplicate results
    const allSpecials = [...offerItems, ...featuredItems, ...budgetSnacks]
    const uniqueSpecials = allSpecials.filter((item, index, self) => 
      index === self.findIndex(t => t.id === item.id)
    ).slice(0, 6)

    // Transform the data for frontend consumption
    const transformedSpecials = uniqueSpecials.map(dish => {
      const hasOffer = dish.offerPrice && dish.offerPrice < dish.basePrice
      const discount = hasOffer && dish.offerPrice ? Math.round(((dish.basePrice - dish.offerPrice) / dish.basePrice) * 100) : 0
      
      return {
        id: dish.id,
        name: dish.name,
        description: dish.description,
        originalPrice: hasOffer ? dish.basePrice : undefined,
        discountPrice: dish.offerPrice,
        price: dish.offerPrice || dish.basePrice,
        image: dish.image,
        badge: hasOffer ? `${discount}% OFF` : 'Special',
        isVeg: dish.isVegetarian,
        category: dish.categories?.[0]?.toLowerCase() || 'special',
        discount: discount,
        rating: 4.1 + Math.random() * 0.7,
        reviewCount: 20 + Math.floor(Math.random() * 80),
        preparationTime: '12-18 min'
      }
    })

    // Update caches
    cachedData = transformedSpecials
    cacheTimestamp = now
    lightningCache.setInstant(cacheKey, transformedSpecials) // Store in instant cache

    return NextResponse.json({
      success: true,
      specials: transformedSpecials,
      cached: false
    })

  } catch (error) {
    console.error(error)
    console.error('Error type:', error instanceof Error ? error.constructor.name : typeof error)
    console.error('Error message:', error instanceof Error ? error.message : error)
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch today\'s specials',
        details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : String(error)) : undefined
      },
      { status: 500 }
    )
  }
} 