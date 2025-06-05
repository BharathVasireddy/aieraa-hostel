import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get current user with university info
    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check if user has admin privileges (ADMIN or MANAGER)
    if (!['ADMIN', 'MANAGER'].includes(currentUser.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const { id: menuItemId } = await params

    const menuItem = await prisma.menuItem.findUnique({
      where: { id: menuItemId },
      include: {
        university: {
          select: {
            id: true,
            name: true,
            code: true
          }
        },
        availability: {
          where: {
            date: {
              gte: new Date()
            }
          },
          orderBy: {
            date: 'asc'
          }
        }
      }
    })

    if (!menuItem) {
      return NextResponse.json(
        { error: 'Menu item not found' },
        { status: 404 }
      )
    }

    // MANAGER can only access menu items from their university
    if (currentUser.role === 'MANAGER' && menuItem.universityId !== currentUser.universityId) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    return NextResponse.json(menuItem)
  } catch (error) {
    console.error('Error fetching menu item:', error)
    return NextResponse.json(
      { error: 'Failed to fetch menu item' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get current user with university info
    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check if user has admin privileges (ADMIN or MANAGER)
    if (!['ADMIN', 'MANAGER'].includes(currentUser.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const { id: menuItemId } = await params
    const body = await request.json()
    const {
      name,
      description,
      basePrice,
      categories,
      isVegetarian = false,
      isVegan = false,
      image,
      isActive,
      variants = []
    } = body

    // Validate required fields
    if (!name || !basePrice || !categories || categories.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields: name, basePrice, categories' },
        { status: 400 }
      )
    }

    // Validate categories
    const validCategories = ['BREAKFAST', 'LUNCH', 'DINNER', 'SNACKS', 'BEVERAGES']
    const invalidCategories = categories.filter((cat: string) => !validCategories.includes(cat.toUpperCase()))
    if (invalidCategories.length > 0) {
      return NextResponse.json(
        { error: `Invalid categories: ${invalidCategories.join(', ')}` },
        { status: 400 }
      )
    }

    // Validate variants
    if (variants.length === 0) {
      return NextResponse.json(
        { error: 'At least one variant is required' },
        { status: 400 }
      )
    }

    // Ensure exactly one default variant
    const defaultVariants = variants.filter((v: any) => v.isDefault)
    if (defaultVariants.length !== 1) {
      return NextResponse.json(
        { error: 'Exactly one variant must be set as default' },
        { status: 400 }
      )
    }

    // Check if menu item exists
    const existingMenuItem = await prisma.menuItem.findUnique({
      where: { id: menuItemId },
      include: {
        variants: true
      }
    })

    if (!existingMenuItem) {
      return NextResponse.json(
        { error: 'Menu item not found' },
        { status: 404 }
      )
    }

    // MANAGER can only edit menu items from their university
    if (currentUser.role === 'MANAGER' && existingMenuItem.universityId !== currentUser.universityId) {
      return NextResponse.json(
        { error: 'Cannot edit menu items from other universities' },
        { status: 403 }
      )
    }

    // Delete existing variants and create new ones
    await prisma.menuItemVariant.deleteMany({
      where: { menuItemId: menuItemId }
    })

    // Update menu item with new variants
    const updatedMenuItem = await prisma.menuItem.update({
      where: { id: menuItemId },
      data: {
        name,
        description,
        basePrice: parseFloat(basePrice),
        categories: categories.map((cat: string) => cat.toUpperCase()),
        isVegetarian,
        isVegan,
        image,
        isActive: isActive !== undefined ? isActive : existingMenuItem.isActive,
        updatedAt: new Date(),
        variants: {
          create: variants.map((variant: any) => ({
            name: variant.name,
            price: parseFloat(variant.price),
            isDefault: variant.isDefault,
            isActive: variant.isActive !== undefined ? variant.isActive : true
          }))
        }
      },
      include: {
        university: {
          select: {
            id: true,
            name: true,
            code: true
          }
        },
        variants: true
      }
    })

    return NextResponse.json(updatedMenuItem)
  } catch (error) {
    console.error('Error updating menu item:', error)
    return NextResponse.json(
      { error: 'Failed to update menu item' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get current user with university info
    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check if user has admin privileges (ADMIN or MANAGER)
    if (!['ADMIN', 'MANAGER'].includes(currentUser.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const { id: menuItemId } = await params
    const body = await request.json()
    const { isActive } = body

    if (isActive === undefined) {
      return NextResponse.json(
        { error: 'isActive field is required' },
        { status: 400 }
      )
    }

    // Check if menu item exists
    const existingMenuItem = await prisma.menuItem.findUnique({
      where: { id: menuItemId }
    })

    if (!existingMenuItem) {
      return NextResponse.json(
        { error: 'Menu item not found' },
        { status: 404 }
      )
    }

    // MANAGER can only toggle menu items from their university
    if (currentUser.role === 'MANAGER' && existingMenuItem.universityId !== currentUser.universityId) {
      return NextResponse.json(
        { error: 'Cannot modify menu items from other universities' },
        { status: 403 }
      )
    }

    // Toggle active status
    const updatedMenuItem = await prisma.menuItem.update({
      where: { id: menuItemId },
      data: {
        isActive,
        updatedAt: new Date()
      },
      include: {
        university: {
          select: {
            id: true,
            name: true,
            code: true
          }
        }
      }
    })

    return NextResponse.json(updatedMenuItem)
  } catch (error) {
    console.error('Error toggling menu item status:', error)
    return NextResponse.json(
      { error: 'Failed to update menu item status' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get current user with university info
    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check if user has admin privileges (ADMIN or MANAGER)
    if (!['ADMIN', 'MANAGER'].includes(currentUser.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const { id: menuItemId } = await params

    // Check if menu item exists
    const existingMenuItem = await prisma.menuItem.findUnique({
      where: { id: menuItemId }
    })

    if (!existingMenuItem) {
      return NextResponse.json(
        { error: 'Menu item not found' },
        { status: 404 }
      )
    }

    // MANAGER can only delete menu items from their university
    if (currentUser.role === 'MANAGER' && existingMenuItem.universityId !== currentUser.universityId) {
      return NextResponse.json(
        { error: 'Cannot delete menu items from other universities' },
        { status: 403 }
      )
    }

    // Soft delete by setting isActive to false
    const deletedMenuItem = await prisma.menuItem.update({
      where: { id: menuItemId },
      data: {
        isActive: false,
        updatedAt: new Date()
      }
    })

    return NextResponse.json({ message: 'Menu item deleted successfully', menuItem: deletedMenuItem })
  } catch (error) {
    console.error('Error deleting menu item:', error)
    return NextResponse.json(
      { error: 'Failed to delete menu item' },
      { status: 500 }
    )
  }
} 