import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sanitizeString, checkRateLimit } from '@/lib/validation'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Rate limiting
    const rateLimit = checkRateLimit(`menu-${session.user.email}`, 30, 60000) // 30 requests per minute
    if (!rateLimit.allowed) {
      return NextResponse.json({ 
        error: 'Too many requests. Please try again later.' 
      }, { status: 429 })
    }

    // Get current user
    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { university: true }
    })

    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Only students can access this endpoint
    if (currentUser.role !== 'STUDENT') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0]
    const category = sanitizeString(searchParams.get('category') || 'all')
    const search = sanitizeString(searchParams.get('search') || '')
    const vegOnly = searchParams.get('vegOnly') === 'true'

    // Build where clause for filtering
    const whereClause: any = {
      universityId: currentUser.universityId,
      isActive: true
    }

    // Filter by category (handle multiple categories)
    if (category && category !== 'all') {
      whereClause.categories = {
        has: category.toUpperCase()
      }
    }

    // Search filter
    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ]
    }

    // Vegetarian filter
    if (vegOnly) {
      whereClause.isVegetarian = true
    }

    // Get menu items with variants and availability
    const menuItems = await prisma.menuItem.findMany({
      where: whereClause,
      include: {
        variants: {
          where: { isActive: true },
          orderBy: { isDefault: 'desc' }
        },
        availability: {
          where: {
            date: new Date(date),
            isAvailable: true
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    })

    // Filter items that are available on the requested date
    // If no availability record exists, assume item is available (default behavior)
    const availableItems = menuItems.filter(item => 
      item.availability.length === 0 || item.availability.some(avail => avail.isAvailable)
    )

    // Transform items to include variant information
    const transformedItems = availableItems.map(item => ({
      id: item.id,
      name: item.name,
      description: item.description,
      basePrice: item.basePrice,
      price: item.variants.find(v => v.isDefault)?.price || item.basePrice,
      offerPrice: null, // Calculate if needed
      categories: item.categories,
      isVegetarian: item.isVegetarian,
      isVegan: item.isVegan,
      image: item.image,
      variants: item.variants.map(variant => ({
        id: variant.id,
        name: variant.name,
        price: variant.price,
        isDefault: variant.isDefault,
        isActive: variant.isActive
      })),
      availability: item.availability[0] // First availability record for the date
    }))

    return NextResponse.json({
      success: true,
      menuItems: transformedItems,
      date,
      totalItems: transformedItems.length
    })

  } catch (error) {
    console.error('Error fetching student menu:', error)
    return NextResponse.json(
      { error: 'Failed to fetch menu' },
      { status: 500 }
    )
  }
} 