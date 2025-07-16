import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sanitizeString, checkRateLimit } from '@/lib/validation'
import { getFastMenuItems } from '@/lib/db-optimized'
import { trackAPIEndpoint } from '@/lib/performance'

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Rate limiting
    const rateLimit = checkRateLimit(`menu-${session.user.email}`, 30, 60000)
    if (!rateLimit.allowed) {
      return NextResponse.json({ 
        error: 'Too many requests. Please try again later.' 
      }, { status: 429 })
    }

    // Get current user - minimal query for auth check only
    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { 
        id: true, 
        role: true, 
        universityId: true 
      }
    })

    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (currentUser.role !== 'STUDENT') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0]
    const category = sanitizeString(searchParams.get('category') || 'all')
    const search = sanitizeString(searchParams.get('search') || '')
    const vegOnly = searchParams.get('vegOnly') === 'true'

    // Use lightning-fast optimized query with request deduplication
    const menuItems = await getFastMenuItems(currentUser.universityId, date, {
      category: category === 'all' ? undefined : category,
      search: search || undefined,
      vegOnly
    })

    // Transform items (already optimized by fast query)
    const transformedItems = menuItems.map(item => ({
      id: item.id,
      name: item.name,
      description: item.description,
      basePrice: item.basePrice,
      price: item.variants.find(v => v.isDefault)?.price || item.basePrice,
      offerPrice: item.offerPrice,
      categories: item.categories,
      isVegetarian: item.isVegetarian,
      isVegan: item.isVegan,
      isFeatured: item.isFeatured,
      image: item.image,
      variants: item.variants,
      availability: item.availability[0]
    }))

    return NextResponse.json({
      success: true,
      menuItems: transformedItems,
      date,
      totalItems: transformedItems.length,
      performance: {
        cached: false, // Will be true when deduplication kicks in
        timestamp: Date.now()
      }
    })
  } catch (error) {
    console.error('Error fetching student menu:', error)
    return NextResponse.json({ error: 'Failed to fetch menu' }, { status: 500 })
  }
} 