import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Validation schema for meal selection
const mealSelectionSchema = z.object({
  mealPlanId: z.string().min(1, 'Meal plan is required'),
  date: z.string().refine((date) => !isNaN(Date.parse(date)), 'Invalid date format'),
  mealType: z.enum(['BREAKFAST', 'LUNCH', 'DINNER']),
});

// Helper function to check if deadline has passed (5 PM previous day)
function isDeadlinePassed(mealDate: Date): boolean {
  const now = new Date();
  const deadline = new Date(mealDate);
  deadline.setDate(deadline.getDate() - 1); // Previous day
  deadline.setHours(17, 0, 0, 0); // 5 PM
  
  return now > deadline;
}

// GET /api/meal-planning/selections - Get meal selections
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const universityId = searchParams.get('universityId') || session.user.universityId;
    const userId = searchParams.get('userId') || session.user.id;
    const date = searchParams.get('date');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const mealType = searchParams.get('mealType');

    // Verify access based on role
    if (session.user.role === 'STUDENT') {
      // Students can only view their own selections
      if (userId !== session.user.id) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }
      if (universityId !== session.user.universityId) {
        return NextResponse.json({ error: 'Access denied to this university' }, { status: 403 });
      }
    } else if (session.user.role === 'MANAGER') {
      // Managers can view all selections in their university
      if (universityId !== session.user.universityId) {
        return NextResponse.json({ error: 'Access denied to this university' }, { status: 403 });
      }
    }
    // ADMIN can view everything

    // Build where clause
    const where: any = {};

    if (session.user.role === 'STUDENT') {
      where.userId = session.user.id;
    } else if (userId) {
      where.userId = userId;
    }

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

    // Include meal plan university filter
    where.mealPlan = {
      universityId,
    };

    const selections = await prisma.mealSelection.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            studentId: true,
          },
        },
        mealPlan: {
          include: {
            mealCategory: true,
            mealItems: {
              orderBy: {
                order: 'asc',
              },
            },
          },
        },
      },
      orderBy: [
        { date: 'asc' },
        { mealType: 'asc' },
      ],
    });

    return NextResponse.json({ selections });
  } catch (error) {
    console.error('Error fetching meal selections:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/meal-planning/selections - Create meal selection
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'STUDENT' && session.user.role !== 'MANAGER' && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = mealSelectionSchema.parse(body);

    const userId = body.userId || session.user.id;
    const mealDate = new Date(validatedData.date);

    // Students can only create selections for themselves
    if (session.user.role === 'STUDENT' && userId !== session.user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Check if deadline has passed (except for managers and admins who can override)
    if (session.user.role === 'STUDENT' && isDeadlinePassed(mealDate)) {
      return NextResponse.json({ 
        error: 'Selection deadline has passed. Selections must be made by 5 PM the previous day.' 
      }, { status: 400 });
    }

    // Verify meal plan exists and belongs to correct university
    const mealPlan = await prisma.mealPlan.findUnique({
      where: { id: validatedData.mealPlanId },
      include: {
        mealCategory: true,
      },
    });

    if (!mealPlan) {
      return NextResponse.json({ error: 'Meal plan not found' }, { status: 404 });
    }

    // Verify university access
    const userUniversityId = session.user.role === 'STUDENT' ? session.user.universityId : 
                            (body.universityId || session.user.universityId);
    
    if (mealPlan.universityId !== userUniversityId) {
      return NextResponse.json({ error: 'Invalid meal plan for this university' }, { status: 400 });
    }

    // Check if selection already exists
    const existingSelection = await prisma.mealSelection.findUnique({
      where: {
        userId_date_mealType: {
          userId,
          date: mealDate,
          mealType: validatedData.mealType,
        },
      },
    });

    if (existingSelection) {
      // If locked and user is student, prevent change
      if (existingSelection.isLocked && session.user.role === 'STUDENT') {
        return NextResponse.json({ 
          error: 'Selection is locked and cannot be changed' 
        }, { status: 400 });
      }

      // Update existing selection
      const updatedSelection = await prisma.mealSelection.update({
        where: { id: existingSelection.id },
        data: {
          mealPlanId: validatedData.mealPlanId,
          isLocked: session.user.role === 'STUDENT' ? isDeadlinePassed(mealDate) : false,
        },
        include: {
          mealPlan: {
            include: {
              mealCategory: true,
              mealItems: {
                orderBy: {
                  order: 'asc',
                },
              },
            },
          },
        },
      });

      return NextResponse.json({ selection: updatedSelection });
    } else {
      // Create new selection
      const newSelection = await prisma.mealSelection.create({
        data: {
          userId,
          mealPlanId: validatedData.mealPlanId,
          date: mealDate,
          mealType: validatedData.mealType,
          isLocked: session.user.role === 'STUDENT' ? isDeadlinePassed(mealDate) : false,
        },
        include: {
          mealPlan: {
            include: {
              mealCategory: true,
              mealItems: {
                orderBy: {
                  order: 'asc',
                },
              },
            },
          },
        },
      });

      return NextResponse.json({ selection: newSelection }, { status: 201 });
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    
    console.error('Error creating meal selection:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/meal-planning/selections - Delete meal selection
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const selectionId = searchParams.get('id');
    const userId = searchParams.get('userId');
    const date = searchParams.get('date');
    const mealType = searchParams.get('mealType');

    if (!selectionId && !(userId && date && mealType)) {
      return NextResponse.json({ 
        error: 'Either selection ID or userId + date + mealType is required' 
      }, { status: 400 });
    }

    let selection;

    if (selectionId) {
      selection = await prisma.mealSelection.findUnique({
        where: { id: selectionId },
      });
    } else {
      selection = await prisma.mealSelection.findUnique({
        where: {
          userId_date_mealType: {
            userId: userId!,
            date: new Date(date!),
            mealType: mealType as any,
          },
        },
      });
    }

    if (!selection) {
      return NextResponse.json({ error: 'Selection not found' }, { status: 404 });
    }

    // Students can only delete their own selections
    if (session.user.role === 'STUDENT' && selection.userId !== session.user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Check if deadline has passed for students
    if (session.user.role === 'STUDENT' && (selection.isLocked || isDeadlinePassed(selection.date))) {
      return NextResponse.json({ 
        error: 'Selection deadline has passed and cannot be modified' 
      }, { status: 400 });
    }

    await prisma.mealSelection.delete({
      where: { id: selection.id },
    });

    return NextResponse.json({ message: 'Selection deleted successfully' });
  } catch (error) {
    console.error('Error deleting meal selection:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 