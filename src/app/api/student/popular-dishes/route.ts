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

    // Get popular dishes based on order frequency for the user's university
    const popularDishes = await prisma.menuItem.findMany({
      where: {
        universityId: session.user.universityId,
        isActive: true
      },
      include: {
        orderItems: {
          where: {
            order: {
              createdAt: {
                gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
              }
            }
          }
        },
        _count: {
          select: {
            orderItems: {
              where: {
                order: {
                  createdAt: {
                    gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
                  }
                }
              }
            }
          }
        }
      },
      orderBy: {
        orderItems: {
          _count: 'desc'
        }
      },
      take: 6 // Top 6 popular dishes
    })

    // Transform the data for frontend consumption
    const transformedDishes = popularDishes.map(dish => ({
      id: dish.id,
      name: dish.name,
      description: dish.description,
      basePrice: dish.basePrice,
      image: dish.image,
      orders: dish._count.orderItems,
      isVeg: dish.isVegetarian,
      category: dish.categories?.[0]?.toLowerCase() || 'snacks',
      calories: dish.calories,
      protein: dish.protein,
      carbs: dish.carbs,
      fat: dish.fat
    }))

    return NextResponse.json({
      success: true,
      dishes: transformedDishes
    })

  } catch (error) {
    console.error('Error fetching popular dishes:', error)
    return NextResponse.json(
      { error: 'Failed to fetch popular dishes' },
      { status: 500 }
    )
  }
} 