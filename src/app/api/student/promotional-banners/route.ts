import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const universityId = searchParams.get('universityId') || session.user.universityId

    if (!universityId) {
      return NextResponse.json({ error: 'University ID is required' }, { status: 400 })
    }

    // Fetch active promotional banners for the university, ordered by display order
    const banners = await prisma.promotionalBanner.findMany({
      where: {
        universityId,
        isActive: true,
        // Only show banners that are either not expired or don't have expiry
        OR: [
          { offerValidUntil: null },
          { offerValidUntil: { gte: new Date() } }
        ]
      },
      orderBy: [
        { order: 'asc' },
        { createdAt: 'desc' }
      ],
      select: {
        id: true,
        title: true,
        description: true,
        image: true,
        actionType: true,
        actionValue: true,
        buttonText: true,
        discountPercentage: true,
        offerValidUntil: true,
        backgroundColor: true,
        textColor: true,
        order: true
      }
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