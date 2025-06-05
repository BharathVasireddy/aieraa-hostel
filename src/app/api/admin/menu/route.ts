import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get current user with university info
    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { university: true }
    })

    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check if user has admin privileges (ADMIN or MANAGER)
    if (!['ADMIN', 'MANAGER'].includes(currentUser.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const status = searchParams.get('status') // 'active', 'inactive', 'all'
    const search = searchParams.get('search')

    // Build dynamic where clause for filtering
    const whereClause: any = {}

    // University scoping: MANAGER can only see their university's menu items
    // ADMIN can see all universities' menu items
    if (currentUser.role === 'MANAGER') {
      whereClause.universityId = currentUser.universityId
    }

    // Filter by category
    if (category && category !== 'all') {
      whereClause.category = category.toUpperCase()
    }

    // Filter by status
    if (status === 'active') {
      whereClause.isActive = true
    } else if (status === 'inactive') {
      whereClause.isActive = false
    }

    // Search filter
    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ]
    }

    const menuItems = await prisma.menuItem.findMany({
      where: whereClause,
      include: {
        university: {
          select: {
            id: true,
            name: true,
            code: true
          }
        },
        variants: {
          orderBy: {
            isDefault: 'desc' // Show default variant first
          }
        },
        availability: {
          where: {
            date: {
              gte: new Date()
            }
          },
          orderBy: {
            date: 'asc'
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(menuItems)
  } catch (error) {
    console.error('Error fetching menu items for admin:', error)
    return NextResponse.json(
      { error: 'Failed to fetch menu items' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 Starting menu item creation...')
    
    const session = await getServerSession(authOptions)
    console.log('Session:', session ? 'Found' : 'Not found')
    
    if (!session?.user?.email) {
      console.log('❌ No session or email found')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('📧 User email from session:', session.user.email)

    // Get current user with university info
    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { university: true }
    })

    console.log('👤 Current user found:', currentUser ? 'Yes' : 'No')
    if (currentUser) {
      console.log('👤 User details:', {
        id: currentUser.id,
        name: currentUser.name,
        role: currentUser.role,
        status: currentUser.status,
        universityId: currentUser.universityId,
        universityName: currentUser.university?.name
      })
    }

    if (!currentUser) {
      console.log('❌ User not found in database')
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check if user has admin privileges (ADMIN or MANAGER)
    if (!['ADMIN', 'MANAGER'].includes(currentUser.role)) {
      console.log('❌ Insufficient permissions. User role:', currentUser.role)
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const body = await request.json()
    console.log('📝 Request body received:', {
      name: body.name,
      basePrice: body.basePrice,
      categories: body.categories,
      universityId: body.universityId,
      variantsCount: body.variants?.length || 0
    })

    const {
      name,
      description,
      basePrice,
      categories,
      isVegetarian = false,
      isVegan = false,
      universityId,
      image,
      variants = []
    } = body

    // Validate required fields
    if (!name || !basePrice || !categories || categories.length === 0) {
      console.log('❌ Missing required fields')
      return NextResponse.json(
        { error: 'Missing required fields: name, basePrice, categories' },
        { status: 400 }
      )
    }

    // Validate categories
    const validCategories = ['BREAKFAST', 'LUNCH', 'DINNER', 'SNACKS', 'BEVERAGES']
    const invalidCategories = categories.filter((cat: string) => !validCategories.includes(cat.toUpperCase()))
    if (invalidCategories.length > 0) {
      console.log('❌ Invalid categories:', invalidCategories)
      return NextResponse.json(
        { error: `Invalid categories: ${invalidCategories.join(', ')}` },
        { status: 400 }
      )
    }

    // Validate variants
    if (variants.length === 0) {
      console.log('❌ No variants provided')
      return NextResponse.json(
        { error: 'At least one variant is required' },
        { status: 400 }
      )
    }

    // Ensure exactly one default variant
    const defaultVariants = variants.filter((v: any) => v.isDefault)
    if (defaultVariants.length !== 1) {
      console.log('❌ Invalid default variants count:', defaultVariants.length)
      return NextResponse.json(
        { error: 'Exactly one variant must be set as default' },
        { status: 400 }
      )
    }

    // Validate university exists
    const targetUniversity = await prisma.university.findUnique({
      where: { id: universityId }
    })
    
    console.log('🏫 Target university:', targetUniversity ? 'Found' : 'Not found')
    if (!targetUniversity) {
      console.log('❌ University not found:', universityId)
      return NextResponse.json(
        { error: 'University not found' },
        { status: 400 }
      )
    }

    // Check if user has permission to create items for this university
    if (currentUser.role === 'MANAGER' && currentUser.universityId !== universityId) {
      console.log('❌ University permission denied. User uni:', currentUser.universityId, 'Target uni:', universityId)
      return NextResponse.json(
        { error: 'Cannot create menu items for other universities' },
        { status: 403 }
      )
    }

    console.log('✅ All validations passed. Creating menu item...')

    // Create menu item with variants
    const menuItem = await prisma.menuItem.create({
      data: {
        name,
        description,
        basePrice: parseFloat(basePrice),
        categories: categories.map((cat: string) => cat.toUpperCase()),
        isVegetarian,
        isVegan,
        image,
        universityId,
        variants: {
          create: variants.map((variant: any) => ({
            name: variant.name,
            price: parseFloat(variant.price),
            isDefault: variant.isDefault,
            isActive: variant.isActive !== undefined ? variant.isActive : true
          }))
        }
      },
      include: {
        university: {
          select: {
            id: true,
            name: true,
            code: true
          }
        },
        variants: true
      }
    })

    console.log('✅ Menu item created successfully:', menuItem.id)

    // Create availability for next 7 days
    console.log('📅 Creating availability records...')
    const today = new Date()
    const availabilityPromises = []

    for (let i = 0; i < 7; i++) {
      const date = new Date(today)
      date.setDate(today.getDate() + i)
      
      availabilityPromises.push(
        prisma.menuItemAvailability.create({
          data: {
            menuItemId: menuItem.id,
            date: date,
            isAvailable: true,
            maxQuantity: 50,
            currentQuantity: 0
          }
        })
      )
    }

    await Promise.all(availabilityPromises)
    console.log('✅ Availability records created')

    return NextResponse.json(menuItem, { status: 201 })
  } catch (error) {
    console.error('❌ Error creating menu item:', error)
    
    // Check if it's a Prisma error
    if (error && typeof error === 'object' && 'code' in error) {
      console.error('Prisma error code:', error.code)
      console.error('Prisma error meta:', 'meta' in error ? error.meta : 'No meta available')
      
      if (error.code === 'P2003') {
        console.error('Foreign key constraint failed. Details:', 'meta' in error ? error.meta : 'No details')
        return NextResponse.json(
          { 
            error: 'Foreign key constraint failed',
            details: 'meta' in error ? error.meta : null,
            message: 'One of the referenced records does not exist'
          },
          { status: 400 }
        )
      }
    }
    
    return NextResponse.json(
      { error: 'Failed to create menu item' },
      { status: 500 }
    )
  }
} 