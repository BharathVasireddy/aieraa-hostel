import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const dateParam = searchParams.get('date')

    if (!dateParam) {
      return NextResponse.json(
        { error: 'Date parameter is required' },
        { status: 400 }
      )
    }

    const date = new Date(dateParam)
    if (isNaN(date.getTime())) {
      return NextResponse.json(
        { error: 'Invalid date format' },
        { status: 400 }
      )
    }

    // Get menu items with their availability for the specific date
    const menuItems = await prisma.menuItem.findMany({
      where: {
        isActive: true
      },
      include: {
        university: true,
        availability: {
          where: {
            date: {
              gte: new Date(date.getFullYear(), date.getMonth(), date.getDate()),
              lt: new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1)
            }
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    })

    const formattedItems = menuItems
      .filter(item => {
        // If no availability record exists, show item as available (default)
        if (item.availability.length === 0) return true
        // If availability record exists, check if it's available
        return item.availability[0].isAvailable
      })
      .map(item => {
        const availability = item.availability[0]
        return {
          id: item.id,
          name: item.name,
          description: item.description || '',
          basePrice: item.basePrice,
          categories: item.categories,
          isVegetarian: item.isVegetarian,
          isVegan: item.isVegan,
          calories: item.calories || 0,
          protein: item.protein || 0,
          carbs: item.carbs || 0,
          fat: item.fat || 0,
          allergens: item.allergens,
          university: item.university.name,
          image: item.image,
          isAvailable: availability?.isAvailable ?? true,
          maxQuantity: availability?.maxQuantity ?? 50,
          currentQuantity: availability?.currentQuantity ?? 0
        }
      })

    return NextResponse.json(formattedItems)
  } catch (error) {
    console.error('Error fetching menu availability:', error)
    return NextResponse.json(
      { error: 'Failed to fetch menu availability' },
      { status: 500 }
    )
  }
} 