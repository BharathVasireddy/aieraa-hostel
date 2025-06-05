import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Razorpay from 'razorpay'

interface OrderItem {
  menuItemId: string
  quantity: number
  price: number
}

// Initialize Razorpay only if keys are provided
const razorpay = process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET 
  ? new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    })
  : null

// Get orders for a user
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const skip = (page - 1) * limit

    const orders = await prisma.order.findMany({
      where: {
        userId: session.user.id
      },
      include: {
        orderItems: {
          include: {
            menuItem: {
              select: {
                id: true,
                name: true,
                categories: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip,
      take: limit
    })

    const totalOrders = await prisma.order.count({
      where: {
        userId: session.user.id
      }
    })

    return NextResponse.json({
      success: true,
      orders,
      pagination: {
        page,
        limit,
        total: totalOrders,
        hasMore: (page * limit) < totalOrders
      }
    })

  } catch (error) {
    console.error('Error fetching orders:', error)
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    )
  }
}

// Create a new order
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { items, orderDate, specialInstructions, paymentMethod } = body

    // Validate required fields
    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Order items are required' }, { status: 400 })
    }

    if (!orderDate) {
      return NextResponse.json({ error: 'Order date is required' }, { status: 400 })
    }

    // Get user details
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        university: {
          include: {
            settings: true
          }
        }
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Validate menu items and calculate total
    let totalAmount = 0
    const validatedItems = []

    for (const item of items) {
      // Extract base menu item ID (remove variant suffix if present)
      const baseMenuItemId = item.menuItemId.includes('-') 
        ? item.menuItemId.split('-')[0] 
        : item.menuItemId
      
      const menuItem = await prisma.menuItem.findFirst({
        where: {
          id: baseMenuItemId,
          universityId: user.universityId,
          isActive: true
        },
        include: {
          variants: true
        }
      })

      if (!menuItem) {
        return NextResponse.json({ 
          error: `Menu item ${baseMenuItemId} not found or not available` 
        }, { status: 400 })
      }

      // Handle variant pricing
      let itemPrice = menuItem.basePrice
      let variantId = null

      if (item.menuItemId.includes('-')) {
        const variantIdFromRequest = item.menuItemId.split('-')[1]
        const variant = menuItem.variants.find(v => v.id === variantIdFromRequest)
        
        if (variant && variant.isActive) {
          itemPrice = variant.price
          variantId = variant.id
        } else {
          return NextResponse.json({ 
            error: `Variant ${variantIdFromRequest} not found or not available` 
          }, { status: 400 })
        }
      } else {
        // Use default variation if no specific variation selected
        const defaultVariant = menuItem.variants.find(v => v.isDefault)
        if (defaultVariant) {
          itemPrice = defaultVariant.price
          variantId = defaultVariant.id
        }
      }

      const itemTotal = itemPrice * item.quantity

      validatedItems.push({
        menuItemId: menuItem.id,
        variantId: variantId,
        quantity: item.quantity,
        price: itemPrice
      })

      totalAmount += itemTotal
    }

    // Add tax
    const taxRate = user.university?.settings?.taxRate || 0.1
    const taxAmount = Math.round(totalAmount * taxRate)
    const finalTotal = totalAmount + taxAmount

    // Generate order number
    const orderCount = await prisma.order.count()
    const orderNumber = `AH${String(orderCount + 1).padStart(6, '0')}`

    // Create order
    const order = await prisma.order.create({
      data: {
        orderNumber,
        userId: user.id,
        universityId: user.universityId,
        orderDate: new Date(orderDate),
        status: 'PENDING',
        totalAmount: finalTotal,
        taxAmount,
        subtotalAmount: totalAmount,
        paymentMethod,
        paymentStatus: paymentMethod === 'cash' ? 'PENDING' : 'PENDING',
        specialInstructions: specialInstructions || '',
        orderItems: {
          create: validatedItems
        }
      },
      include: {
        orderItems: {
          include: {
            menuItem: {
              select: {
                id: true,
                name: true,
                categories: true
              }
            }
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Order placed successfully',
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        totalAmount: order.totalAmount,
        orderDate: order.orderDate,
        paymentMethod: order.paymentMethod,
        paymentStatus: order.paymentStatus
      }
    })

  } catch (error) {
    console.error('Error creating order:', error)
    return NextResponse.json(
      { error: 'Failed to create order' },
      { status: 500 }
    )
  }
} 