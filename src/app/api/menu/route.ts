import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's university from session
    const userUniversityId = session.user.universityId;
    if (!userUniversityId || userUniversityId === 'invalid') {
      return NextResponse.json(
        { error: 'University not found' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const dateString =
      searchParams.get('date') || new Date().toISOString().split('T')[0];
    const category = searchParams.get('category');

    // Parse the date properly
    const requestedDate = new Date(dateString + 'T00:00:00.000Z');

    // Build where clause for filtering
    const whereClause: any = {
      universityId: userUniversityId,
      isActive: true,
    };

    // Add category filter if provided
    if (category && category !== 'all') {
      whereClause.categories = {
        has: category.toUpperCase(),
      };
    }

    // Get menu items for the user's university with availability data
    const menuItems = await prisma.menuItem.findMany({
      where: whereClause,
      include: {
        availability: {
          where: {
            date: requestedDate,
          },
        },
        variants: {
          where: {
            isActive: true,
          },
          orderBy: {
            price: 'asc',
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    // Filter items based on availability for the requested date
    const availableItems = menuItems.filter(item => {
      // If no availability records exist, item is considered available by default
      if (item.availability.length === 0) {
        return true;
      }

      // If availability record exists, check if it's marked as available
      const availabilityRecord = item.availability[0];
      return availabilityRecord.isAvailable === true;
    });

    // Transform the data for frontend consumption
    const transformedItems = availableItems.map(item => {
      // Get the default variant or the first variant for price
      const defaultVariant =
        item.variants.find(v => v.isDefault) || item.variants[0];
      const basePrice = defaultVariant?.price || item.basePrice;

      return {
        id: item.id,
        name: item.name,
        description: item.description || '',
        price: basePrice, // Use variant price or base price
        offerPrice: item.offerPrice || undefined, // Include offer price if exists
        category: item.categories[0] || 'SNACKS', // Get first category
        categories: item.categories,
        isVegetarian: item.isVegetarian,
        isVegan: item.isVegan,
        image: item.image,
        allergens: item.allergens,
        calories: item.calories,
        protein: item.protein,
        carbs: item.carbs,
        fat: item.fat,
        isAvailable: true, // Already filtered for available items
        isFeatured: item.isFeatured,
        variants: item.variants.map(variant => ({
          id: variant.id,
          name: variant.name,
          price: variant.price,
          isDefault: variant.isDefault,
        })),
      };
    });

    return NextResponse.json({
      success: true,
      items: transformedItems, // Changed from 'menuItems' to 'items' to match student expectation
      date: dateString,
      totalItems: transformedItems.length,
    });
  } catch (error) {
    console.error('Menu API Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch menu items' },
      { status: 500 }
    );
  }
}
