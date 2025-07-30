import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/meal-planning/analytics - Get meal planning analytics
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
    const date = searchParams.get('date');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const mealType = searchParams.get('mealType');
    const format = searchParams.get('format'); // 'csv' for export

    // Verify access to university
    if (session.user.role === 'MANAGER' && universityId !== session.user.universityId) {
      return NextResponse.json({ error: 'Access denied to this university' }, { status: 403 });
    }

    // Build where clause for selections
    const where: any = {
      mealPlan: {
        universityId,
      },
    };

    if (date) {
      where.date = new Date(date);
    } else if (startDate || endDate) {
      where.date = {};
      if (startDate) {where.date.gte = new Date(startDate);}
      if (endDate) {where.date.lte = new Date(endDate);}
    }

    if (mealType) {
      where.mealType = mealType;
    }

    // Get detailed selections for export or analysis
    const selections = await prisma.mealSelection.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            studentId: true,
            roomNumber: true,
            course: true,
            year: true,
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
        { user: { name: 'asc' } },
      ],
    });

    // If CSV export is requested
    if (format === 'csv') {
      const csvRows = [
        'Date,Meal Type,Student Name,Student ID,Room Number,Course,Year,Category,Menu Items'
      ];

      selections.forEach(selection => {
        const menuItems = selection.mealPlan.mealItems.map(item => item.name).join('; ');
        csvRows.push([
          selection.date.toISOString().split('T')[0],
          selection.mealType,
          selection.user.name,
          selection.user.studentId || '',
          selection.user.roomNumber || '',
          selection.user.course || '',
          selection.user.year?.toString() || '',
          selection.mealPlan.mealCategory.name,
          menuItems,
        ].map(field => `"${field}"`).join(','));
      });

      const csvContent = csvRows.join('\n');
      const filename = `meal_selections_${date || (startDate ? startDate + '_to_' + endDate : 'all')}.csv`;

      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="${filename}"`,
        },
      });
    }

    // Calculate analytics
    const analytics = {
      totalSelections: selections.length,
      selectionsByMealType: {} as Record<string, number>,
      selectionsByCategory: {} as Record<string, number>,
      selectionsByDate: {} as Record<string, Record<string, number>>,
      studentParticipation: {
        totalStudents: 0,
        participatingStudents: 0,
        participationRate: 0,
      },
      topCategories: [] as Array<{ category: string; count: number; percentage: number }>,
    };

    // Count selections by meal type
    selections.forEach(selection => {
      analytics.selectionsByMealType[selection.mealType] = 
        (analytics.selectionsByMealType[selection.mealType] || 0) + 1;
    });

    // Count selections by category
    selections.forEach(selection => {
      const categoryName = selection.mealPlan.mealCategory.name;
      analytics.selectionsByCategory[categoryName] = 
        (analytics.selectionsByCategory[categoryName] || 0) + 1;
    });

    // Count selections by date and meal type
    selections.forEach(selection => {
      const dateStr = selection.date.toISOString().split('T')[0];
      if (!analytics.selectionsByDate[dateStr]) {
        analytics.selectionsByDate[dateStr] = {};
      }
      analytics.selectionsByDate[dateStr][selection.mealType] = 
        (analytics.selectionsByDate[dateStr][selection.mealType] || 0) + 1;
    });

    // Calculate student participation
    const uniqueStudents = new Set(selections.map(s => s.userId));
    analytics.studentParticipation.participatingStudents = uniqueStudents.size;

    // Get total students in university
    const totalStudents = await prisma.user.count({
      where: {
        universityId,
        role: 'STUDENT',
        status: 'APPROVED',
      },
    });

    analytics.studentParticipation.totalStudents = totalStudents;
    analytics.studentParticipation.participationRate = 
      totalStudents > 0 ? (uniqueStudents.size / totalStudents) * 100 : 0;

    // Calculate top categories
    analytics.topCategories = Object.entries(analytics.selectionsByCategory)
      .map(([category, count]) => ({
        category,
        count,
        percentage: (count / analytics.totalSelections) * 100,
      }))
      .sort((a, b) => b.count - a.count);

    // Get meal plans for the date range to show availability vs selections
    const mealPlansWhere: any = {
      universityId,
      isActive: true,
    };

    if (date) {
      mealPlansWhere.date = new Date(date);
    } else if (startDate || endDate) {
      mealPlansWhere.date = {};
      if (startDate) {mealPlansWhere.date.gte = new Date(startDate);}
      if (endDate) {mealPlansWhere.date.lte = new Date(endDate);}
    }

    if (mealType) {
      mealPlansWhere.mealType = mealType;
    }

    const availableMealPlans = await prisma.mealPlan.findMany({
      where: mealPlansWhere,
      include: {
        mealCategory: true,
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

    return NextResponse.json({
      analytics,
      availableMealPlans,
      selections: selections.map(selection => ({
        id: selection.id,
        date: selection.date,
        mealType: selection.mealType,
        isLocked: selection.isLocked,
        student: {
          name: selection.user.name,
          studentId: selection.user.studentId,
          roomNumber: selection.user.roomNumber,
          course: selection.user.course,
          year: selection.user.year,
        },
        mealPlan: {
          category: selection.mealPlan.mealCategory.name,
          items: selection.mealPlan.mealItems.map(item => item.name),
        },
      })),
    });
  } catch (error) {
    console.error('Error fetching meal planning analytics:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 