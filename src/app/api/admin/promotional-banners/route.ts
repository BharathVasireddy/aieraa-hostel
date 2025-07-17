import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

// Validation schema for promotional banner
const createBannerSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100, 'Title too long'),
  description: z.string().max(200, 'Description too long').optional(),
  image: z.string().url('Invalid image URL'),
  actionType: z.enum(['none', 'menu', 'category', 'url', 'search']).default('none'),
  actionValue: z.string().optional(),
  buttonText: z.string().max(50, 'Button text too long').optional(),
  discountPercentage: z.number().min(0).max(100).optional(),
  offerValidUntil: z.string().datetime().optional(),
  backgroundColor: z.string().regex(/^#[0-9A-F]{6}$/i, 'Invalid hex color').default('#10B981'),
  textColor: z.string().regex(/^#[0-9A-F]{6}$/i, 'Invalid hex color').default('#FFFFFF'),
  order: z.number().int().min(0).default(0),
  isActive: z.boolean().default(true)
})

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || !['ADMIN', 'MANAGER'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // For ADMIN: show all banners, for MANAGER: show only their university's banners
    const whereClause = session.user.role === 'ADMIN' 
      ? {} 
      : { universityId: session.user.universityId }

    const banners = await prisma.promotionalBanner.findMany({
      where: whereClause,
      include: {
        university: {
          select: {
            name: true,
            code: true
          }
        }
      },
      orderBy: [
        { order: 'asc' },
        { createdAt: 'desc' }
      ]
    })

    return NextResponse.json({
      success: true,
      banners
    })

  } catch (error) {
    console.error('Error fetching promotional banners:', error)
    return NextResponse.json(
      { error: 'Failed to fetch promotional banners' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || !['ADMIN', 'MANAGER'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    
    // Validate input
    const validatedData = createBannerSchema.parse(body)

    // Determine university ID
    let universityId = session.user.universityId
    if (session.user.role === 'ADMIN' && body.universityId) {
      universityId = body.universityId
    }

    if (!universityId) {
      return NextResponse.json({ error: 'University ID is required' }, { status: 400 })
    }

    // If no order specified, set it to the highest order + 1
    let order = validatedData.order
    if (order === 0) {
      const lastBanner = await prisma.promotionalBanner.findFirst({
        where: { universityId },
        orderBy: { order: 'desc' }
      })
      order = (lastBanner?.order || 0) + 1
    }

    const banner = await prisma.promotionalBanner.create({
      data: {
        ...validatedData,
        order,
        universityId,
        createdBy: session.user.id,
        offerValidUntil: validatedData.offerValidUntil ? new Date(validatedData.offerValidUntil) : null
      },
      include: {
        university: {
          select: {
            name: true,
            code: true
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      banner
    }, { status: 201 })

  } catch (error) {
    console.error('Error creating promotional banner:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to create promotional banner' },
      { status: 500 }
    )
  }
} 