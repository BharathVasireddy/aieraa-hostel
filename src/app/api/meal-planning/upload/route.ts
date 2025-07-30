import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// CSV row validation schema
const csvRowSchema = z.object({
  Date: z.string().refine((date) => !isNaN(Date.parse(date)), 'Invalid date format'),
  Meal_Type: z.enum(['BREAKFAST', 'LUNCH', 'DINNER']),
  Category_Name: z.string().min(1, 'Category name is required'),
  Item_1: z.string().min(1, 'At least one item is required'),
  Item_2: z.string().optional(),
  Item_3: z.string().optional(),
  Item_4: z.string().optional(),
  Item_5: z.string().optional(),
  Item_6: z.string().optional(),
  Item_7: z.string().optional(),
  Item_8: z.string().optional(),
});

// Helper function to parse CSV content
function parseCSV(csvContent: string): any[] {
  const lines = csvContent.trim().split('\n');
  if (lines.length < 2) {
    throw new Error('CSV must have at least a header and one data row');
  }

  const headers = lines[0].split(',').map(h => h.trim());
  const rows = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim());
    const row: any = {};
    
    headers.forEach((header, index) => {
      row[header] = values[index] || '';
    });
    
    if (row.Date) { // Skip empty rows
      rows.push(row);
    }
  }

  return rows;
}

// Helper function to create meal category if it doesn't exist
async function getOrCreateMealCategory(categoryName: string, universityId: string) {
  let category = await prisma.mealCategory.findUnique({
    where: {
      universityId_name: {
        universityId,
        name: categoryName,
      },
    },
  });

  if (!category) {
    // Determine category properties based on name
    const name = categoryName.toLowerCase();
    const isVegetarian = name.includes('veg') && !name.includes('non');
    const isVegan = name.includes('vegan');
    const isHalal = name.includes('halal');

    category = await prisma.mealCategory.create({
      data: {
        name: categoryName,
        universityId,
        isVegetarian,
        isVegan,
        isHalal,
      },
    });
  }

  return category;
}

// POST /api/meal-planning/upload - Upload CSV file with meal plans
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'MANAGER' && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const universityId = formData.get('universityId') as string || session.user.universityId;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Verify access to university
    if (session.user.role === 'MANAGER' && universityId !== session.user.universityId) {
      return NextResponse.json({ error: 'Access denied to this university' }, { status: 403 });
    }

    // Validate file type
    if (!file.name.endsWith('.csv') && !file.name.endsWith('.txt')) {
      return NextResponse.json({ error: 'Only CSV files are allowed' }, { status: 400 });
    }

    // Read file content
    const csvContent = await file.text();
    
    // Parse CSV
    let parsedRows;
    try {
      parsedRows = parseCSV(csvContent);
    } catch (error) {
      return NextResponse.json({ 
        error: `CSV parsing error: ${error instanceof Error ? error.message : 'Unknown error'}` 
      }, { status: 400 });
    }

    if (parsedRows.length === 0) {
      return NextResponse.json({ error: 'CSV file is empty' }, { status: 400 });
    }

    // Validate rows
    const validatedRows: z.infer<typeof csvRowSchema>[] = [];
    const errors: string[] = [];

    for (let i = 0; i < parsedRows.length; i++) {
      try {
        const validatedRow = csvRowSchema.parse(parsedRows[i]);
        validatedRows.push(validatedRow);
      } catch (error) {
        if (error instanceof z.ZodError) {
          errors.push(`Row ${i + 2}: ${error.issues.map(e => e.message).join(', ')}`);
        }
      }
    }

    if (errors.length > 0) {
      return NextResponse.json({ 
        error: 'Validation errors found',
        details: errors 
      }, { status: 400 });
    }

    // Process data in transaction
    const result = await prisma.$transaction(async (tx) => {
      const created = {
        categories: 0,
        mealPlans: 0,
        mealItems: 0,
        duplicates: 0,
      };

      for (const row of validatedRows) {
        // Get or create meal category
        const category = await getOrCreateMealCategory(row.Category_Name, universityId);
        if (category.createdAt.getTime() === category.updatedAt.getTime()) {
          created.categories++;
        }

        const mealDate = new Date(row.Date);

        // Check if meal plan already exists
        const existingPlan = await tx.mealPlan.findUnique({
          where: {
            date_mealType_mealCategoryId_universityId: {
              date: mealDate,
              mealType: row.Meal_Type,
              mealCategoryId: category.id,
              universityId,
            },
          },
        });

        if (existingPlan) {
          created.duplicates++;
          continue;
        }

        // Create meal plan
        const mealPlan = await tx.mealPlan.create({
          data: {
            date: mealDate,
            mealType: row.Meal_Type,
            mealCategoryId: category.id,
            universityId,
          },
        });
        created.mealPlans++;

        // Collect meal items
        const mealItems = [];
        for (let i = 1; i <= 8; i++) {
          const itemKey = `Item_${i}` as keyof typeof row;
          const itemValue = row[itemKey];
          if (itemValue && itemValue.trim()) {
            mealItems.push({
              mealPlanId: mealPlan.id,
              name: itemValue.trim(),
              order: i - 1,
            });
          }
        }

        // Create meal items
        if (mealItems.length > 0) {
          await tx.mealItem.createMany({
            data: mealItems,
          });
          created.mealItems += mealItems.length;
        }
      }

      return created;
    });

    return NextResponse.json({
      message: 'CSV upload completed successfully',
      summary: {
        totalRows: validatedRows.length,
        categoriesCreated: result.categories,
        mealPlansCreated: result.mealPlans,
        mealItemsCreated: result.mealItems,
        duplicatesSkipped: result.duplicates,
      },
    }, { status: 201 });

  } catch (error) {
    console.error('Error uploading CSV:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET /api/meal-planning/upload - Get CSV template
export async function GET() {
  const csvTemplate = `Date,Meal_Type,Category_Name,Item_1,Item_2,Item_3,Item_4,Item_5,Item_6,Item_7,Item_8
2025-07-29,BREAKFAST,South Indian Veg,Idli,Sambar,Coconut Chutney,Filter Coffee,,,,
2025-07-29,BREAKFAST,North Indian Veg,Paratha,Dal,Pickle,Tea,,,,
2025-07-29,LUNCH,South Indian Veg,Rice,Sambar,Vegetable Curry,Curd,Pickle,,,
2025-07-29,LUNCH,North Indian Non Veg,Chicken Curry,Rice,Roti,Salad,,,,
2025-07-29,DINNER,Halal,Biryani,Raita,Shorba,Kebab,,,,
2025-07-30,BREAKFAST,Continental,Bread,Butter,Jam,Milk,Cornflakes,,,
2025-07-30,LUNCH,Chinese,Fried Rice,Manchurian,Soup,Noodles,,,,
2025-07-30,DINNER,Italian,Pasta,Garlic Bread,Salad,Juice,,,,`;

  return new NextResponse(csvTemplate, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': 'attachment; filename="meal_planning_template.csv"',
    },
  });
} 