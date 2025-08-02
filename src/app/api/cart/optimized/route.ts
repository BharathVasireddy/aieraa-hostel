import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { CartCache } from '@/lib/redis-cache';

// GET - Fetch user's cart with Redis caching
export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Try cache first (1-5ms)
    const cachedCart = await CartCache.getCart(session.user.id);
    if (cachedCart) {
      return NextResponse.json({
        success: true,
        items: cachedCart.items,
        totalItems: cachedCart.items.reduce((sum, item) => sum + item.quantity, 0),
        totalAmount: cachedCart.total,
        fromCache: true,
      });
    }

    // Fallback to database (50-200ms)
    let cart = await prisma.cart.findUnique({
      where: { userId: session.user.id },
      include: {
        items: {
          include: {
            menuItem: {
              select: {
                id: true,
                name: true,
                basePrice: true,
                offerPrice: true,
                categories: true,
                isVegetarian: true,
                isVegan: true,
                image: true,
                isActive: true,
              },
            },
            variant: {
              select: {
                id: true,
                name: true,
                price: true,
                isActive: true,
              },
            },
          },
        },
      },
    });

    if (!cart) {
      cart = await prisma.cart.create({
        data: { userId: session.user.id },
        include: {
          items: {
            include: {
              menuItem: {
                select: {
                  id: true,
                  name: true,
                  basePrice: true,
                  offerPrice: true,
                  categories: true,
                  isVegetarian: true,
                  isVegan: true,
                  image: true,
                  isActive: true,
                },
              },
              variant: {
                select: {
                  id: true,
                  name: true,
                  price: true,
                  isActive: true,
                },
              },
            },
          },
        },
      });
    }

    // Filter and transform
    const activeItems = cart.items.filter(
      item =>
        item.menuItem.isActive && (item.variant ? item.variant.isActive : true)
    );

    const transformedItems = activeItems.map(item => ({
      id: item.menuItem.id,
      name: item.menuItem.name,
      price:
        item.variant?.price ||
        item.menuItem.offerPrice ||
        item.menuItem.basePrice,
      quantity: item.quantity,
      category: item.menuItem.categories[0] || 'SNACKS',
      isVegetarian: item.menuItem.isVegetarian,
      isVegan: item.menuItem.isVegan,
      image: item.menuItem.image,
      variantId: item.variantId || undefined,
      variantName: item.variant?.name,
      cartItemId: item.id,
    }));

    const totalAmount = transformedItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    // Cache the result for next request
    await CartCache.setCart(session.user.id, {
      userId: session.user.id,
      items: transformedItems,
      total: totalAmount,
      updatedAt: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      items: transformedItems,
      totalItems: transformedItems.reduce(
        (sum, item) => sum + item.quantity,
        0
      ),
      totalAmount,
      fromCache: false,
    });
  } catch (error) {
    console.error('Cart fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch cart' },
      { status: 500 }
    );
  }
}

// POST - Add item to cart with optimistic caching
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { menuItemId, variantId, quantity = 1 } = await request.json();

    // Get current cart from cache or database
    let currentCart = await CartCache.getCart(session.user.id);
    
    if (!currentCart) {
      // Fetch from database
      const dbCart = await prisma.cart.findUnique({
        where: { userId: session.user.id },
        include: {
          items: {
            include: {
              menuItem: true,
              variant: true,
            },
          },
        },
      });

      if (dbCart) {
        currentCart = {
          userId: session.user.id,
          items: dbCart.items.map(item => ({
            id: item.menuItem.id,
            name: item.menuItem.name,
            price: item.variant?.price || item.menuItem.offerPrice || item.menuItem.basePrice,
            quantity: item.quantity,
            variantId: item.variantId || undefined,
            variantName: item.variant?.name,
          })),
          total: 0,
          updatedAt: new Date().toISOString(),
        };
      } else {
        currentCart = {
          userId: session.user.id,
          items: [],
          total: 0,
          updatedAt: new Date().toISOString(),
        };
      }
    }

    // Update cart in database
    const cart = await prisma.cart.upsert({
      where: { userId: session.user.id },
      update: {},
      create: { userId: session.user.id },
    });

    // Add or update item
    await prisma.cartItem.upsert({
      where: {
        cartId_menuItemId_variantId: {
          cartId: cart.id,
          menuItemId,
          variantId: variantId || null,
        },
      },
      update: {
        quantity: { increment: quantity },
      },
      create: {
        cartId: cart.id,
        menuItemId,
        variantId: variantId || null,
        quantity,
      },
    });

    // Get updated cart from database
    const updatedCart = await prisma.cart.findUnique({
      where: { userId: session.user.id },
      include: {
        items: {
          include: {
            menuItem: true,
            variant: true,
          },
        },
      },
    });

    if (!updatedCart) {
      throw new Error('Failed to update cart');
    }

    // Transform and cache
    const transformedItems = updatedCart.items.map(item => ({
      id: item.menuItem.id,
      name: item.menuItem.name,
      price: item.variant?.price || item.menuItem.offerPrice || item.menuItem.basePrice,
      quantity: item.quantity,
      category: item.menuItem.categories[0] || 'SNACKS',
      isVegetarian: item.menuItem.isVegetarian,
      isVegan: item.menuItem.isVegan,
      image: item.menuItem.image,
      variantId: item.variantId || undefined,
      variantName: item.variant?.name,
      cartItemId: item.id,
    }));

    const totalAmount = transformedItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    // Update cache
    await CartCache.setCart(session.user.id, {
      userId: session.user.id,
      items: transformedItems,
      total: totalAmount,
      updatedAt: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      items: transformedItems,
      totalItems: transformedItems.reduce(
        (sum, item) => sum + item.quantity,
        0
      ),
      totalAmount,
    });
  } catch (error) {
    console.error('Add to cart error:', error);
    return NextResponse.json(
      { error: 'Failed to add item to cart' },
      { status: 500 }
    );
  }
} 