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

    // Get current user
    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check if user is a caterer
    if (currentUser.role !== 'CATERER') {
      return NextResponse.json({ error: 'Access denied. Caterer role required.' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') // Optional status filter
    const limit = parseInt(searchParams.get('limit') || '50')

    // Build where clause
    const whereClause: any = {
      universityId: currentUser.universityId, // Only orders from caterer's university
      status: {
        in: ['PENDING', 'APPROVED', 'PREPARING', 'READY', 'SERVED']
      }
    }

    // Add status filter if provided
    if (status && status !== 'all') {
      whereClause.status = status
    }

    // Get orders for serving
    const orders = await prisma.order.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            studentId: true
          }
        },
        orderItems: {
          include: {
            menuItem: {
              select: {
                id: true,
                name: true
              }
            },
            variant: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      },
      orderBy: [
        { status: 'asc' }, // Prioritize ready orders
        { createdAt: 'desc' }
      ],
      take: limit
    })

    // Format the response
    const formattedOrders = orders.map(order => ({
      id: order.id,
      orderNumber: order.orderNumber,
      customerName: order.user.name,
      studentId: order.user.studentId,
      status: order.status,
      totalAmount: order.totalAmount,
      orderDate: order.orderDate.toISOString(),
      createdAt: order.createdAt.toISOString(),
      items: order.orderItems.map(item => ({
        name: item.menuItem.name,
        quantity: item.quantity,
        variant: item.variant?.name
      }))
    }))

    return NextResponse.json(formattedOrders)
  } catch (error) {
    console.error('Error fetching caterer orders:', error)
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    )
  }
} 