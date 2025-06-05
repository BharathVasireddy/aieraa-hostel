import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: orderId } = await params

    // Fetch the order with all related data
    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        userId: session.user.id // Ensure user can only access their own orders
      },
      include: {
        orderItems: {
          include: {
            menuItem: {
              select: {
                id: true,
                name: true,
                categories: true,
                image: true,
                isVegetarian: true,
                isVegan: true
              }
            },
            variant: {
              select: {
                id: true,
                name: true
              }
            }
          }
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            roomNumber: true,
            studentId: true,
            university: {
              select: {
                name: true,
                address: true
              }
            }
          }
        }
      }
    })

    if (!order) {
      return NextResponse.json({ 
        error: 'Order not found or you do not have permission to view this order' 
      }, { status: 404 })
    }

    // Transform the data to match the expected format
    const transformedOrder = {
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      paymentStatus: order.paymentStatus,
      totalAmount: order.totalAmount,
      subtotalAmount: order.subtotalAmount || order.totalAmount,
      taxAmount: order.taxAmount || 0,
      orderDate: order.orderDate,
      createdAt: order.createdAt,
      completedAt: order.completedAt,
      specialInstructions: order.specialInstructions,
      // Transform orderItems to items array as expected by frontend
      items: order.orderItems.map(item => ({
        id: item.id,
        name: item.menuItem.name,
        quantity: item.quantity,
        price: item.price,
        variant: item.variant ? {
          name: item.variant.name
        } : undefined,
        menuItem: {
          image: item.menuItem.image,
          isVegetarian: item.menuItem.isVegetarian || false,
          isVegan: item.menuItem.isVegan || false
        }
      }))
    }

    return NextResponse.json(transformedOrder)

  } catch (error) {
    console.error('Error fetching order details:', error)
    return NextResponse.json(
      { error: 'Failed to fetch order details' },
      { status: 500 }
    )
  }
} 