import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET - Fetch user's cart
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get or create cart for user
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
      // Create empty cart if doesn't exist
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

    // Filter out inactive items
    const activeItems = cart.items.filter(
      item =>
        item.menuItem.isActive && (item.variant ? item.variant.isActive : true)
    );

    // Transform to frontend format
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
      variantId: item.variantId,
      variantName: item.variant?.name,
      cartItemId: item.id,
    }));

    return NextResponse.json({
      success: true,
      items: transformedItems,
      totalItems: transformedItems.reduce(
        (sum, item) => sum + item.quantity,
        0
      ),
      totalAmount: transformedItems.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
      ),
    });
  } catch (error) {
    console.error('Cart fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch cart' },
      { status: 500 }
    );
  }
}

// POST - Add item to cart
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { menuItemId, variantId, quantity = 1 } = body;

    if (!menuItemId) {
      return NextResponse.json(
        { error: 'Menu item ID is required' },
        { status: 400 }
      );
    }

    // Verify menu item exists and is active
    const menuItem = await prisma.menuItem.findFirst({
      where: {
        id: menuItemId,
        isActive: true,
      },
      include: {
        variants: {
          where: { isActive: true },
        },
      },
    });

    if (!menuItem) {
      return NextResponse.json(
        { error: 'Menu item not found or inactive' },
        { status: 404 }
      );
    }

    // If variant specified, verify it exists and is active
    if (variantId) {
      const variant = menuItem.variants.find(v => v.id === variantId);
      if (!variant) {
        return NextResponse.json(
          { error: 'Variant not found or inactive' },
          { status: 404 }
        );
      }
    }

    // Get or create cart
    let cart = await prisma.cart.findUnique({
      where: { userId: session.user.id },
    });

    if (!cart) {
      cart = await prisma.cart.create({
        data: { userId: session.user.id },
      });
    }

    // Check if item already exists in cart
    const existingCartItem = await prisma.cartItem.findUnique({
      where: {
        cartId_menuItemId_variantId: {
          cartId: cart.id,
          menuItemId,
          variantId: variantId || '', // Use empty string instead of null
        },
      },
    });

    if (existingCartItem) {
      // Update quantity
      await prisma.cartItem.update({
        where: { id: existingCartItem.id },
        data: {
          quantity: existingCartItem.quantity + quantity,
          updatedAt: new Date(),
        },
      });
    } else {
      // Create new cart item
      await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          menuItemId,
          variantId: variantId || '', // Use empty string instead of null/undefined
          quantity,
        },
      });
    }

    // Return updated cart
    const response = await GET(request);
    return response;
  } catch (error) {
    console.error('Add to cart error:', error);
    return NextResponse.json(
      { error: 'Failed to add item to cart' },
      { status: 500 }
    );
  }
}

// PUT - Update cart item quantity
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { menuItemId, variantId, quantity } = body;

    if (!menuItemId || quantity === undefined) {
      return NextResponse.json(
        { error: 'Menu item ID and quantity are required' },
        { status: 400 }
      );
    }

    const cart = await prisma.cart.findUnique({
      where: { userId: session.user.id },
    });

    if (!cart) {
      return NextResponse.json({ error: 'Cart not found' }, { status: 404 });
    }

    if (quantity <= 0) {
      // Remove item if quantity is 0 or negative
      await prisma.cartItem.deleteMany({
        where: {
          cartId: cart.id,
          menuItemId,
          variantId: variantId || '',
        },
      });
    } else {
      // Update quantity
      await prisma.cartItem.updateMany({
        where: {
          cartId: cart.id,
          menuItemId,
          variantId: variantId || '',
        },
        data: {
          quantity,
          updatedAt: new Date(),
        },
      });
    }

    // Return updated cart
    const response = await GET(request);
    return response;
  } catch (error) {
    console.error('Update cart error:', error);
    return NextResponse.json(
      { error: 'Failed to update cart item' },
      { status: 500 }
    );
  }
}

// DELETE - Clear cart or remove specific item
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const menuItemId = searchParams.get('menuItemId');
    const variantId = searchParams.get('variantId');

    const cart = await prisma.cart.findUnique({
      where: { userId: session.user.id },
    });

    if (!cart) {
      return NextResponse.json({ error: 'Cart not found' }, { status: 404 });
    }

    if (menuItemId) {
      // Remove specific item
      await prisma.cartItem.deleteMany({
        where: {
          cartId: cart.id,
          menuItemId,
          variantId: variantId || '',
        },
      });
    } else {
      // Clear entire cart
      await prisma.cartItem.deleteMany({
        where: { cartId: cart.id },
      });
    }

    return NextResponse.json({
      success: true,
      message: menuItemId ? 'Item removed from cart' : 'Cart cleared',
    });
  } catch (error) {
    console.error('Delete cart error:', error);
    return NextResponse.json(
      { error: 'Failed to remove item from cart' },
      { status: 500 }
    );
  }
}
