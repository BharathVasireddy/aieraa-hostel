import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const reorderSchema = z.object({
  direction: z.enum(['up', 'down'])
})

interface RouteParams {
  params: {
    id: string
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || !['ADMIN', 'MANAGER'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { direction } = reorderSchema.parse(body)

    // Get the current banner
    const currentBanner = await prisma.promotionalBanner.findUnique({
      where: { id: params.id }
    })

    if (!currentBanner) {
      return NextResponse.json({ error: 'Banner not found' }, { status: 404 })
    }

    // Check university access for managers
    if (session.user.role === 'MANAGER' && currentBanner.universityId !== session.user.universityId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get all banners in the same university, ordered by order field
    const allBanners = await prisma.promotionalBanner.findMany({
      where: {
        universityId: currentBanner.universityId
      },
      orderBy: {
        order: 'asc'
      }
    })

    const currentIndex = allBanners.findIndex(banner => banner.id === params.id)
    
    if (currentIndex === -1) {
      return NextResponse.json({ error: 'Banner not found in list' }, { status: 404 })
    }

    let targetIndex: number
    
    if (direction === 'up') {
      if (currentIndex === 0) {
        return NextResponse.json({ error: 'Banner is already at the top' }, { status: 400 })
      }
      targetIndex = currentIndex - 1
    } else {
      if (currentIndex === allBanners.length - 1) {
        return NextResponse.json({ error: 'Banner is already at the bottom' }, { status: 400 })
      }
      targetIndex = currentIndex + 1
    }

    const targetBanner = allBanners[targetIndex]

    // Swap the order values
    await prisma.$transaction([
      prisma.promotionalBanner.update({
        where: { id: currentBanner.id },
        data: { order: targetBanner.order }
      }),
      prisma.promotionalBanner.update({
        where: { id: targetBanner.id },
        data: { order: currentBanner.order }
      })
    ])

    return NextResponse.json({
      success: true,
      message: `Banner moved ${direction} successfully`
    })

  } catch (error) {
    console.error('Error reordering banner:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid direction. Must be "up" or "down"' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to reorder banner' },
      { status: 500 }
    )
  }
} 