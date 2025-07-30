import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Validation schema for meal category
const mealCategorySchema = z.object({
  name: z.string().min(1, 'Category name is required'),
  description: z.string().optional(),
  isVegetarian: z.boolean().default(false),
  isVegan: z.boolean().default(false),
  isHalal: z.boolean().default(false),
});

// GET /api/meal-planning/categories - Get all meal categories
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'MANAGER' && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const universityId = searchParams.get('universityId') || session.user.universityId;

    // Verify access to university
    if (session.user.role === 'MANAGER' && universityId !== session.user.universityId) {
      return NextResponse.json({ error: 'Access denied to this university' }, { status: 403 });
    }

    const categories = await prisma.mealCategory.findMany({
      where: {
        universityId,
        isActive: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    return NextResponse.json({ categories });
  } catch (error) {
    console.error('Error fetching meal categories:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/meal-planning/categories - Create a new meal category
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'MANAGER' && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = mealCategorySchema.parse(body);

    const universityId = body.universityId || session.user.universityId;

    // Verify access to university
    if (session.user.role === 'MANAGER' && universityId !== session.user.universityId) {
      return NextResponse.json({ error: 'Access denied to this university' }, { status: 403 });
    }

    // Check if category name already exists for this university
    const existingCategory = await prisma.mealCategory.findUnique({
      where: {
        universityId_name: {
          universityId,
          name: validatedData.name,
        },
      },
    });

    if (existingCategory) {
      return NextResponse.json({ error: 'Category name already exists' }, { status: 400 });
    }

    const category = await prisma.mealCategory.create({
      data: {
        ...validatedData,
        universityId,
      },
    });

    return NextResponse.json({ category }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    
    console.error('Error creating meal category:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 