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

    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0]
    const category = searchParams.get('category')

    // Build where clause for filtering
    const whereClause: any = {
      universityId: session.user.universityId,
      isActive: true
    }

    // Add category filter if provided
    if (category && category !== 'all') {
      whereClause.categories = {
        has: category.toUpperCase()
      }
    }

    // Get menu items for the user's university
    const menuItems = await prisma.menuItem.findMany({
      where: whereClause,
      include: {
        availability: {
          where: {
            date: new Date(date),
            isAvailable: true
          }
        },
        variants: {
          orderBy: {
            price: 'asc'
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    })

    // Filter items that are available on the requested date
    const availableItems = menuItems.filter(item => 
      item.availability.length > 0 || item.availability.length === 0 // If no availability records, assume available
    )

    // Transform the data for frontend consumption
    const transformedItems = availableItems.map(item => ({
      id: item.id,
      name: item.name,
      description: item.description,
      basePrice: item.basePrice,
      categories: item.categories,
      isVegetarian: item.isVegetarian,
      isVegan: item.isVegan,
      image: item.image,
      allergens: item.allergens,
      calories: item.calories,
      protein: item.protein,
      carbs: item.carbs,
      fat: item.fat,
      variations: item.variants.map(variation => ({
        id: variation.id,
        name: variation.name,
        price: variation.price,
        isDefault: variation.isDefault
      }))
    }))

    return NextResponse.json({
      success: true,
      menuItems: transformedItems,
      date,
      totalItems: transformedItems.length
    })

  } catch (error) {
    console.error('Error fetching menu items:', error)
    return NextResponse.json(
      { error: 'Failed to fetch menu items' },
      { status: 500 }
    )
  }
} 