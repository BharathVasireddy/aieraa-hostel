import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Validation schema for meal item
const mealItemSchema = z.object({
  name: z.string().min(1, 'Item name is required'),
  description: z.string().optional(),
  order: z.number().int().min(0).default(0),
});

// Validation schema for meal plan
const mealPlanSchema = z.object({
  date: z.string().refine((date) => !isNaN(Date.parse(date)), 'Invalid date format'),
  mealType: z.enum(['BREAKFAST', 'LUNCH', 'DINNER']),
  mealCategoryId: z.string().min(1, 'Meal category is required'),
  mealItems: z.array(mealItemSchema).min(1, 'At least one meal item is required'),
});

// GET /api/meal-planning/plans - Get meal plans
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'MANAGER' && session.user.role !== 'ADMIN' && session.user.role !== 'STUDENT') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const universityId = searchParams.get('universityId') || session.user.universityId;
    const date = searchParams.get('date');
    const mealType = searchParams.get('mealType');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Verify access to university
    if ((session.user.role === 'MANAGER' || session.user.role === 'STUDENT') && universityId !== session.user.universityId) {
      return NextResponse.json({ error: 'Access denied to this university' }, { status: 403 });
    }

    // Build where clause
    const where: any = {
      universityId,
      isActive: true,
    };

    if (date) {
      where.date = new Date(date);
    } else if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate);
      if (endDate) where.date.lte = new Date(endDate);
    }

    if (mealType) {
      where.mealType = mealType;
    }

    const mealPlans = await prisma.mealPlan.findMany({
      where,
      include: {
        mealCategory: true,
        mealItems: {
          orderBy: {
            order: 'asc',
          },
        },
        _count: {
          select: {
            selections: true,
          },
        },
      },
      orderBy: [
        { date: 'asc' },
        { mealType: 'asc' },
      ],
    });

    return NextResponse.json({ mealPlans });
  } catch (error) {
    console.error('Error fetching meal plans:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/meal-planning/plans - Create a new meal plan
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
    const validatedData = mealPlanSchema.parse(body);

    const universityId = body.universityId || session.user.universityId;

    // Verify access to university
    if (session.user.role === 'MANAGER' && universityId !== session.user.universityId) {
      return NextResponse.json({ error: 'Access denied to this university' }, { status: 403 });
    }

    // Verify meal category belongs to the same university
    const mealCategory = await prisma.mealCategory.findUnique({
      where: { id: validatedData.mealCategoryId },
    });

    if (!mealCategory || mealCategory.universityId !== universityId) {
      return NextResponse.json({ error: 'Invalid meal category' }, { status: 400 });
    }

    // Check if meal plan already exists for this date, meal type, and category
    const existingPlan = await prisma.mealPlan.findUnique({
      where: {
        date_mealType_mealCategoryId_universityId: {
          date: new Date(validatedData.date),
          mealType: validatedData.mealType,
          mealCategoryId: validatedData.mealCategoryId,
          universityId,
        },
      },
    });

    if (existingPlan) {
      return NextResponse.json({ 
        error: 'Meal plan already exists for this date, meal type, and category' 
      }, { status: 400 });
    }

    // Create meal plan with items in a transaction
    const mealPlan = await prisma.$transaction(async (tx) => {
      const plan = await tx.mealPlan.create({
        data: {
          date: new Date(validatedData.date),
          mealType: validatedData.mealType,
          mealCategoryId: validatedData.mealCategoryId,
          universityId,
        },
      });

      // Create meal items
      const mealItems = await tx.mealItem.createMany({
        data: validatedData.mealItems.map((item, index) => ({
          mealPlanId: plan.id,
          name: item.name,
          description: item.description,
          order: item.order || index,
        })),
      });

      return tx.mealPlan.findUnique({
        where: { id: plan.id },
        include: {
          mealCategory: true,
          mealItems: {
            orderBy: {
              order: 'asc',
            },
          },
        },
      });
    });

    return NextResponse.json({ mealPlan }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    
    console.error('Error creating meal plan:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 