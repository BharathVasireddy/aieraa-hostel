import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Validation schema for meal category update
const updateMealCategorySchema = z.object({
  name: z.string().min(1, 'Category name is required').optional(),
  description: z.string().optional(),
  isVegetarian: z.boolean().optional(),
  isVegan: z.boolean().optional(),
  isHalal: z.boolean().optional(),
  isActive: z.boolean().optional(),
});

interface RouteParams {
  params: {
    id: string;
  };
}

// GET /api/meal-planning/categories/[id] - Get specific meal category
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'MANAGER' && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const category = await prisma.mealCategory.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: {
            mealPlans: true,
          },
        },
      },
    });

    if (!category) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    // Verify access to university
    if (session.user.role === 'MANAGER' && category.universityId !== session.user.universityId) {
      return NextResponse.json({ error: 'Access denied to this university' }, { status: 403 });
    }

    return NextResponse.json({ category });
  } catch (error) {
    console.error('Error fetching meal category:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/meal-planning/categories/[id] - Update meal category
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'MANAGER' && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = updateMealCategorySchema.parse(body);

    // Check if category exists and user has access
    const existingCategory = await prisma.mealCategory.findUnique({
      where: { id: params.id },
    });

    if (!existingCategory) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    // Verify access to university
    if (session.user.role === 'MANAGER' && existingCategory.universityId !== session.user.universityId) {
      return NextResponse.json({ error: 'Access denied to this university' }, { status: 403 });
    }

    // Check if updating name and it conflicts with existing category
    if (validatedData.name && validatedData.name !== existingCategory.name) {
      const conflictingCategory = await prisma.mealCategory.findUnique({
        where: {
          universityId_name: {
            universityId: existingCategory.universityId,
            name: validatedData.name,
          },
        },
      });

      if (conflictingCategory) {
        return NextResponse.json({ error: 'Category name already exists' }, { status: 400 });
      }
    }

    const updatedCategory = await prisma.mealCategory.update({
      where: { id: params.id },
      data: validatedData,
    });

    return NextResponse.json({ category: updatedCategory });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    
    console.error('Error updating meal category:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/meal-planning/categories/[id] - Delete meal category
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'MANAGER' && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Check if category exists and user has access
    const existingCategory = await prisma.mealCategory.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: {
            mealPlans: true,
          },
        },
      },
    });

    if (!existingCategory) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    // Verify access to university
    if (session.user.role === 'MANAGER' && existingCategory.universityId !== session.user.universityId) {
      return NextResponse.json({ error: 'Access denied to this university' }, { status: 403 });
    }

    // Check if category has associated meal plans
    if (existingCategory._count.mealPlans > 0) {
      return NextResponse.json({ 
        error: 'Cannot delete category with existing meal plans. Please delete or reassign meal plans first.' 
      }, { status: 400 });
    }

    await prisma.mealCategory.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Error deleting meal category:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 