import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

// Validation schema for banner updates
const updateBannerSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100, 'Title too long').optional(),
  description: z.string().max(200, 'Description too long').optional(),
  image: z.string().url('Invalid image URL').optional(),
  actionType: z.enum(['none', 'menu', 'category', 'url', 'search']).optional(),
  actionValue: z.string().optional(),
  buttonText: z.string().max(50, 'Button text too long').optional(),
  discountPercentage: z.number().min(0).max(100).optional(),
  offerValidUntil: z.string().datetime().optional().nullable(),
  backgroundColor: z.string().regex(/^#[0-9A-F]{6}$/i, 'Invalid hex color').optional(),
  textColor: z.string().regex(/^#[0-9A-F]{6}$/i, 'Invalid hex color').optional(),
  order: z.number().int().min(0).optional(),
  isActive: z.boolean().optional()
})

interface RouteParams {
  params: {
    id: string
  }
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || !['ADMIN', 'MANAGER'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const banner = await prisma.promotionalBanner.findUnique({
      where: { id: params.id },
      include: {
        university: {
          select: {
            name: true,
            code: true
          }
        }
      }
    })

    if (!banner) {
      return NextResponse.json({ error: 'Banner not found' }, { status: 404 })
    }

    // Check university access for managers
    if (session.user.role === 'MANAGER' && banner.universityId !== session.user.universityId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    return NextResponse.json({
      success: true,
      banner
    })

  } catch (error) {
    console.error('Error fetching banner:', error)
    return NextResponse.json(
      { error: 'Failed to fetch banner' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || !['ADMIN', 'MANAGER'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if banner exists and user has access
    const existingBanner = await prisma.promotionalBanner.findUnique({
      where: { id: params.id }
    })

    if (!existingBanner) {
      return NextResponse.json({ error: 'Banner not found' }, { status: 404 })
    }

    // Check university access for managers
    if (session.user.role === 'MANAGER' && existingBanner.universityId !== session.user.universityId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    
    // Validate input
    const validatedData = updateBannerSchema.parse(body)

    // Handle null offerValidUntil
    const updateData: any = { ...validatedData }
    if ('offerValidUntil' in validatedData) {
      updateData.offerValidUntil = validatedData.offerValidUntil ? new Date(validatedData.offerValidUntil) : null
    }

    const banner = await prisma.promotionalBanner.update({
      where: { id: params.id },
      data: updateData,
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
    })

  } catch (error) {
    console.error('Error updating banner:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to update banner' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || !['ADMIN', 'MANAGER'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if banner exists and user has access
    const existingBanner = await prisma.promotionalBanner.findUnique({
      where: { id: params.id }
    })

    if (!existingBanner) {
      return NextResponse.json({ error: 'Banner not found' }, { status: 404 })
    }

    // Check university access for managers
    if (session.user.role === 'MANAGER' && existingBanner.universityId !== session.user.universityId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await prisma.promotionalBanner.delete({
      where: { id: params.id }
    })

    return NextResponse.json({
      success: true,
      message: 'Banner deleted successfully'
    })

  } catch (error) {
    console.error('Error deleting banner:', error)
    return NextResponse.json(
      { error: 'Failed to delete banner' },
      { status: 500 }
    )
  }
} 