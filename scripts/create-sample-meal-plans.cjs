const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createSampleMealPlans() {
  try {
    console.log('🍽️ Creating sample meal plans...');

    // First, get a university to work with
    const university = await prisma.university.findFirst();
    if (!university) {
      console.error('❌ No university found. Please create a university first.');
      return;
    }

    console.log(`📍 Using university: ${university.name}`);

    // Define meal categories
    const categories = [
      {
        name: 'South Indian Veg',
        description: 'Traditional South Indian vegetarian cuisine',
        isVegetarian: true,
        isVegan: false,
        isHalal: false,
      },
      {
        name: 'North Indian Veg',
        description: 'Classic North Indian vegetarian dishes',
        isVegetarian: true,
        isVegan: false,
        isHalal: false,
      },
      {
        name: 'South Indian Non Veg',
        description: 'South Indian dishes with meat and seafood',
        isVegetarian: false,
        isVegan: false,
        isHalal: false,
      },
      {
        name: 'North Indian Non Veg',
        description: 'North Indian non-vegetarian delicacies',
        isVegetarian: false,
        isVegan: false,
        isHalal: false,
      },
      {
        name: 'Continental',
        description: 'European and Western cuisine',
        isVegetarian: false,
        isVegan: false,
        isHalal: false,
      },
      {
        name: 'Halal',
        description: 'Halal-certified meals',
        isVegetarian: false,
        isVegan: false,
        isHalal: true,
      },
      {
        name: 'Vegan Special',
        description: 'Plant-based vegan meals',
        isVegetarian: true,
        isVegan: true,
        isHalal: false,
      },
    ];

    // Create categories
    const createdCategories = [];
    for (const category of categories) {
      try {
        const existing = await prisma.mealCategory.findUnique({
          where: {
            universityId_name: {
              universityId: university.id,
              name: category.name,
            },
          },
        });

        if (existing) {
          console.log(`✅ Category already exists: ${category.name}`);
          createdCategories.push(existing);
        } else {
          const created = await prisma.mealCategory.create({
            data: {
              ...category,
              universityId: university.id,
            },
          });
          console.log(`✅ Created category: ${category.name}`);
          createdCategories.push(created);
        }
      } catch (error) {
        console.error(`❌ Error creating category ${category.name}:`, error.message);
      }
    }

    // Define meal plans for the next 7 days
    const mealPlans = [];
    const today = new Date();
    
    for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
      const date = new Date(today);
      date.setDate(today.getDate() + dayOffset);
      const dateStr = date.toISOString().split('T')[0];

      // Breakfast plans
      mealPlans.push(
        {
          date: dateStr,
          mealType: 'BREAKFAST',
          categoryName: 'South Indian Veg',
          items: ['Idli', 'Sambar', 'Coconut Chutney', 'Filter Coffee'],
        },
        {
          date: dateStr,
          mealType: 'BREAKFAST',
          categoryName: 'North Indian Veg',
          items: ['Paratha', 'Dal', 'Pickle', 'Tea'],
        },
        {
          date: dateStr,
          mealType: 'BREAKFAST',
          categoryName: 'Continental',
          items: ['Bread', 'Butter', 'Jam', 'Milk', 'Cornflakes'],
        }
      );

      // Lunch plans
      mealPlans.push(
        {
          date: dateStr,
          mealType: 'LUNCH',
          categoryName: 'South Indian Veg',
          items: ['Rice', 'Sambar', 'Vegetable Curry', 'Curd', 'Pickle'],
        },
        {
          date: dateStr,
          mealType: 'LUNCH',
          categoryName: 'North Indian Non Veg',
          items: ['Chicken Curry', 'Rice', 'Roti', 'Salad'],
        },
        {
          date: dateStr,
          mealType: 'LUNCH',
          categoryName: 'Halal',
          items: ['Biryani', 'Raita', 'Shorba', 'Kebab'],
        },
        {
          date: dateStr,
          mealType: 'LUNCH',
          categoryName: 'Vegan Special',
          items: ['Quinoa Bowl', 'Roasted Vegetables', 'Hummus', 'Salad'],
        }
      );

      // Dinner plans
      mealPlans.push(
        {
          date: dateStr,
          mealType: 'DINNER',
          categoryName: 'South Indian Non Veg',
          items: ['Fish Curry', 'Rice', 'Rasam', 'Vegetable Fry'],
        },
        {
          date: dateStr,
          mealType: 'DINNER',
          categoryName: 'North Indian Veg',
          items: ['Rajma', 'Rice', 'Roti', 'Salad'],
        },
        {
          date: dateStr,
          mealType: 'DINNER',
          categoryName: 'Continental',
          items: ['Pasta', 'Garlic Bread', 'Salad', 'Juice'],
        }
      );
    }

    // Create meal plans
    for (const plan of mealPlans) {
      try {
        const category = createdCategories.find(c => c.name === plan.categoryName);
        if (!category) {
          console.error(`❌ Category not found: ${plan.categoryName}`);
          continue;
        }

        // Check if meal plan already exists
        const existing = await prisma.mealPlan.findUnique({
          where: {
            date_mealType_mealCategoryId_universityId: {
              date: new Date(plan.date),
              mealType: plan.mealType,
              mealCategoryId: category.id,
              universityId: university.id,
            },
          },
        });

        if (existing) {
          console.log(`⏭️  Meal plan already exists: ${plan.date} ${plan.mealType} ${plan.categoryName}`);
          continue;
        }

        // Create meal plan
        const mealPlan = await prisma.mealPlan.create({
          data: {
            date: new Date(plan.date),
            mealType: plan.mealType,
            mealCategoryId: category.id,
            universityId: university.id,
          },
        });

        // Create meal items
        for (let i = 0; i < plan.items.length; i++) {
          await prisma.mealItem.create({
            data: {
              mealPlanId: mealPlan.id,
              name: plan.items[i],
              order: i,
            },
          });
        }

        console.log(`✅ Created meal plan: ${plan.date} ${plan.mealType} ${plan.categoryName}`);
      } catch (error) {
        console.error(`❌ Error creating meal plan ${plan.date} ${plan.mealType} ${plan.categoryName}:`, error.message);
      }
    }

    console.log('🎉 Sample meal plans created successfully!');
    console.log(`📊 Created ${createdCategories.length} categories and ${mealPlans.length} meal plans for 7 days`);
    
  } catch (error) {
    console.error('❌ Error creating sample meal plans:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createSampleMealPlans(); 