import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Validation schema for updating menu items
const UpdateMenuItemSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(100, 'Name too long')
    .optional(),
  description: z.string().optional(),
  basePrice: z.number().min(0, 'Price must be positive').optional(),
  offerPrice: z.number().min(0, 'Offer price must be positive').optional(),
  categories: z
    .array(z.enum(['BREAKFAST', 'LUNCH', 'DINNER', 'SNACKS', 'BEVERAGES']))
    .min(1, 'At least one category required')
    .optional(),
  image: z.string().url().optional(),
  isVegetarian: z.boolean().optional(),
  isVegan: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
  isActive: z.boolean().optional(),
  allergens: z.array(z.string()).optional(),
});

// GET: Get individual menu item details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'MANAGER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, role: true, universityId: true },
    });

    if (!currentUser?.universityId) {
      return NextResponse.json(
        { error: 'Manager university not found' },
        { status: 404 }
      );
    }

    const resolvedParams = await params;
    const menuItemId = resolvedParams.id;

    // Get menu item details with variants and availability
    const menuItem = await prisma.menuItem.findUnique({
      where: { id: menuItemId },
      include: {
        variants: {
          orderBy: [{ isDefault: 'desc' }, { name: 'asc' }],
        },
        availability: {
          where: {
            date: {
              gte: new Date(new Date().setHours(0, 0, 0, 0)), // From today
            },
          },
          orderBy: { date: 'asc' },
          take: 30, // Next 30 days
        },
        university: {
          select: {
            name: true,
            code: true,
          },
        },
      },
    });

    if (!menuItem) {
      return NextResponse.json(
        { error: 'Menu item not found' },
        { status: 404 }
      );
    }

    // Ensure menu item belongs to manager's university
    if (menuItem.universityId !== currentUser.universityId) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    return NextResponse.json({
      ...menuItem,
    });
  } catch (error) {
    console.error('Manager menu item details API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch menu item details' },
      { status: 500 }
    );
  }
}

// PATCH: Update menu item
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'MANAGER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, role: true, universityId: true, name: true },
    });

    if (!currentUser?.universityId) {
      return NextResponse.json(
        { error: 'Manager university not found' },
        { status: 404 }
      );
    }

    const resolvedParams = await params;
    const menuItemId = resolvedParams.id;

    // Parse and validate request body
    const body = await request.json();
    const validatedData = UpdateMenuItemSchema.parse(body);

    // Check if menu item exists and belongs to manager's university
    const existingMenuItem = await prisma.menuItem.findUnique({
      where: { id: menuItemId },
      select: {
        id: true,
        name: true,
        universityId: true,
        isActive: true,
      },
    });

    if (!existingMenuItem) {
      return NextResponse.json(
        { error: 'Menu item not found' },
        { status: 404 }
      );
    }

    if (existingMenuItem.universityId !== currentUser.universityId) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // If updating name, check if another item with same name exists
    if (validatedData.name && validatedData.name !== existingMenuItem.name) {
      const duplicateItem = await prisma.menuItem.findFirst({
        where: {
          name: validatedData.name,
          universityId: currentUser.universityId,
          NOT: { id: menuItemId },
        },
      });

      if (duplicateItem) {
        return NextResponse.json(
          {
            error: 'Menu item with this name already exists',
          },
          { status: 409 }
        );
      }
    }

    // Update menu item
    const updatedMenuItem = await prisma.menuItem.update({
      where: { id: menuItemId },
      data: {
        ...validatedData,
        updatedAt: new Date(),
      },
      include: {
        variants: {
          orderBy: [{ isDefault: 'desc' }, { name: 'asc' }],
        },
      },
    });

    // Log the update
    const changedFields = Object.keys(validatedData).join(', ');
    console.log(
      `Manager ${currentUser.name} updated menu item ${existingMenuItem.name}: ${changedFields}`
    );

    return NextResponse.json({
      success: true,
      menuItem: updatedMenuItem,
      message: 'Menu item updated successfully',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Invalid request data',
          details: error.issues,
        },
        { status: 400 }
      );
    }

    console.error('Manager menu item update API error:', error);
    return NextResponse.json(
      { error: 'Failed to update menu item' },
      { status: 500 }
    );
  }
}

// DELETE: Delete menu item (soft delete - mark as inactive)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'MANAGER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, role: true, universityId: true, name: true },
    });

    if (!currentUser?.universityId) {
      return NextResponse.json(
        { error: 'Manager university not found' },
        { status: 404 }
      );
    }

    const resolvedParams = await params;
    const menuItemId = resolvedParams.id;

    // Check if menu item exists and belongs to manager's university
    const existingMenuItem = await prisma.menuItem.findUnique({
      where: { id: menuItemId },
      select: {
        id: true,
        name: true,
        universityId: true,
        isActive: true,
      },
    });

    if (!existingMenuItem) {
      return NextResponse.json(
        { error: 'Menu item not found' },
        { status: 404 }
      );
    }

    if (existingMenuItem.universityId !== currentUser.universityId) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Check if there are any pending or approved orders for this item
    const activeOrders = await prisma.orderItem.count({
      where: {
        menuItemId: menuItemId,
        order: {
          status: {
            in: ['PENDING', 'APPROVED', 'PREPARING', 'READY'],
          },
        },
      },
    });

    if (activeOrders > 0) {
      return NextResponse.json(
        {
          error:
            'Cannot delete menu item with active orders. Deactivate it instead.',
        },
        { status: 400 }
      );
    }

    // Soft delete: mark as inactive and hide from menu
    const deletedMenuItem = await prisma.menuItem.update({
      where: { id: menuItemId },
      data: {
        isActive: false,
        isFeatured: false,
        updatedAt: new Date(),
      },
    });

    // Log the deletion
    console.log(
      `Manager ${currentUser.name} deleted menu item: ${existingMenuItem.name}`
    );

    return NextResponse.json({
      success: true,
      message: 'Menu item deleted successfully',
    });
  } catch (error) {
    console.error('Manager menu item deletion API error:', error);
    return NextResponse.json(
      { error: 'Failed to delete menu item' },
      { status: 500 }
    );
  }
}
