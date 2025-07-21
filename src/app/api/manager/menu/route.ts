import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

// Validation schema for creating new menu items
const CreateMenuItemSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  description: z.string().optional(),
  basePrice: z.number().min(0, 'Price must be positive'),
  offerPrice: z.number().min(0, 'Offer price must be positive').optional(),
  categories: z.array(z.enum(['BREAKFAST', 'LUNCH', 'DINNER', 'SNACKS', 'BEVERAGES'])).min(1, 'At least one category required'),
  image: z.string().url().optional(),
  isVegetarian: z.boolean().default(false),
  isVegan: z.boolean().default(false),
  isFeatured: z.boolean().default(false),
  allergens: z.array(z.string()).default([]),
  variants: z.array(z.object({
    name: z.string().min(1, 'Variant name required'),
    price: z.number().min(0, 'Variant price must be positive'),
    isDefault: z.boolean().default(false)
  })).default([])
})

// GET: Fetch menu items for manager's university
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'MANAGER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, role: true, universityId: true }
    })

    if (!currentUser || !currentUser.universityId) {
      return NextResponse.json({ error: 'Manager university not found' }, { status: 404 })
    }

    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const filter = searchParams.get('filter')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const search = searchParams.get('search')

    // Build where clause
    const whereClause: any = {
      universityId: currentUser.universityId
    }

    // Category filter
    if (category && category !== 'ALL') {
      whereClause.categories = {
        has: category
      }
    }

    // Status and type filters
    if (filter && filter !== 'all') {
      switch (filter) {
        case 'active':
          whereClause.isActive = true
          break
        case 'inactive':
          whereClause.isActive = false
          break
        case 'featured':
          whereClause.isFeatured = true
          break
        case 'vegetarian':
          whereClause.isVegetarian = true
          break
        case 'vegan':
          whereClause.isVegan = true
          break
      }
    }

    // Search filter
    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { allergens: { has: search } }
      ]
    }

    // Fetch menu items and total count in parallel
    const [menuItems, totalCount] = await Promise.all([
      prisma.menuItem.findMany({
        where: whereClause,
        include: {
          variants: {
            where: { isActive: true },
            orderBy: [{ isDefault: 'desc' }, { name: 'asc' }]
          }
        },
        orderBy: [
          { isFeatured: 'desc' },
          { isActive: 'desc' },
          { name: 'asc' }
        ],
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.menuItem.count({ where: whereClause })
    ])

    // Get summary statistics
    const summaryStats = await prisma.menuItem.groupBy({
      by: ['isActive', 'isFeatured', 'isVegetarian', 'isVegan'],
      where: { universityId: currentUser.universityId },
      _count: true
    })

    // Calculate summary
    const summary = {
      total: await prisma.menuItem.count({ where: { universityId: currentUser.universityId } }),
      active: summaryStats.filter(s => s.isActive === true).reduce((acc, s) => acc + s._count, 0),
      inactive: summaryStats.filter(s => s.isActive === false).reduce((acc, s) => acc + s._count, 0),
      featured: summaryStats.filter(s => s.isFeatured === true).reduce((acc, s) => acc + s._count, 0),
      vegetarian: summaryStats.filter(s => s.isVegetarian === true).reduce((acc, s) => acc + s._count, 0),
      vegan: summaryStats.filter(s => s.isVegan === true).reduce((acc, s) => acc + s._count, 0)
    }

    return NextResponse.json({
      menuItems,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit)
      },
      summary
    }, {
      headers: {
        'Cache-Control': 's-maxage=60, stale-while-revalidate=120'
      }
    })

  } catch (error) {
    console.error('Manager menu API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch menu items' },
      { status: 500 }
    )
  }
}

// POST: Create new menu item
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'MANAGER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, role: true, universityId: true, name: true }
    })

    if (!currentUser || !currentUser.universityId) {
      return NextResponse.json({ error: 'Manager university not found' }, { status: 404 })
    }

    // Parse and validate request body
    const body = await request.json()
    const validatedData = CreateMenuItemSchema.parse(body)

    // Check if menu item with same name already exists in this university
    const existingItem = await prisma.menuItem.findFirst({
      where: {
        name: validatedData.name,
        universityId: currentUser.universityId
      }
    })

    if (existingItem) {
      return NextResponse.json({ 
        error: 'Menu item with this name already exists' 
      }, { status: 409 })
    }

    // Validate that only one variant can be default
    const defaultVariants = validatedData.variants.filter(v => v.isDefault)
    if (defaultVariants.length > 1) {
      return NextResponse.json({ 
        error: 'Only one variant can be set as default' 
      }, { status: 400 })
    }

    // Create menu item with variants in a transaction
    const menuItem = await prisma.$transaction(async (tx) => {
      // Create the menu item
      const newItem = await tx.menuItem.create({
        data: {
          name: validatedData.name,
          description: validatedData.description,
          basePrice: validatedData.basePrice,
          offerPrice: validatedData.offerPrice,
          categories: validatedData.categories,
          image: validatedData.image,
          isVegetarian: validatedData.isVegetarian,
          isVegan: validatedData.isVegan,
          isFeatured: validatedData.isFeatured,
          allergens: validatedData.allergens,
          universityId: currentUser.universityId,
          isActive: true
        }
      })

      // Create variants if provided
      if (validatedData.variants.length > 0) {
        await tx.menuItemVariant.createMany({
          data: validatedData.variants.map(variant => ({
            menuItemId: newItem.id,
            name: variant.name,
            price: variant.price,
            isDefault: variant.isDefault,
            isActive: true
          }))
        })
      }

      return newItem
    })

    // Log the creation
    console.log(`Manager ${currentUser.name} created menu item: ${validatedData.name}`)

    // Fetch the created item with variants
    const createdItem = await prisma.menuItem.findUnique({
      where: { id: menuItem.id },
      include: {
        variants: {
          where: { isActive: true },
          orderBy: [{ isDefault: 'desc' }, { name: 'asc' }]
        }
      }
    })

    return NextResponse.json({
      success: true,
      menuItem: createdItem,
      message: 'Menu item created successfully'
    }, { status: 201 })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: 'Invalid request data',
        details: error.issues 
      }, { status: 400 })
    }

    console.error('Manager menu creation API error:', error)
    return NextResponse.json(
      { error: 'Failed to create menu item' },
      { status: 500 }
    )
  }
} 