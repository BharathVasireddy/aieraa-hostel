const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function addMealPlansForManager(managerEmail) {
  try {
    console.log(`🍽️ Adding sample meal plans for manager: ${managerEmail}`);

    // Find the manager and their university
    const manager = await prisma.user.findUnique({
      where: { email: managerEmail },
      include: {
        university: true,
      },
    });

    if (!manager) {
      console.error(`❌ Manager not found with email: ${managerEmail}`);
      return;
    }

    if (manager.role !== 'MANAGER') {
      console.error(`❌ User ${managerEmail} is not a manager. Role: ${manager.role}`);
      return;
    }

    console.log(`📍 Manager: ${manager.name}`);
    console.log(`🏫 University: ${manager.university.name}`);

    const university = manager.university;

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

    // Define diverse meal plans for the next 7 days
    const mealPlans = [];
    const today = new Date();
    
    for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
      const date = new Date(today);
      date.setDate(today.getDate() + dayOffset);
      const dateStr = date.toISOString().split('T')[0];

      // Breakfast plans - 3 options per day
      mealPlans.push(
        {
          date: dateStr,
          mealType: 'BREAKFAST',
          categoryName: 'South Indian Veg',
          items: dayOffset % 2 === 0 
            ? ['Idli', 'Sambar', 'Coconut Chutney', 'Filter Coffee']
            : ['Dosa', 'Sambar', 'Tomato Chutney', 'Filter Coffee'],
        },
        {
          date: dateStr,
          mealType: 'BREAKFAST',
          categoryName: 'North Indian Veg',
          items: dayOffset % 2 === 0 
            ? ['Paratha', 'Dal', 'Pickle', 'Tea']
            : ['Puri', 'Chole', 'Pickle', 'Tea'],
        },
        {
          date: dateStr,
          mealType: 'BREAKFAST',
          categoryName: 'Continental',
          items: dayOffset % 2 === 0 
            ? ['Bread', 'Butter', 'Jam', 'Milk', 'Cornflakes']
            : ['Pancakes', 'Honey', 'Butter', 'Orange Juice', 'Coffee'],
        }
      );

      // Lunch plans - 4 options per day
      mealPlans.push(
        {
          date: dateStr,
          mealType: 'LUNCH',
          categoryName: 'South Indian Veg',
          items: dayOffset % 3 === 0 
            ? ['Rice', 'Sambar', 'Vegetable Curry', 'Curd', 'Pickle']
            : dayOffset % 3 === 1
            ? ['Lemon Rice', 'Sambar', 'Vegetable Fry', 'Curd', 'Pickle']
            : ['Tamarind Rice', 'Rasam', 'Mixed Vegetable', 'Curd', 'Papad'],
        },
        {
          date: dateStr,
          mealType: 'LUNCH',
          categoryName: 'North Indian Non Veg',
          items: dayOffset % 3 === 0 
            ? ['Chicken Curry', 'Rice', 'Roti', 'Salad']
            : dayOffset % 3 === 1
            ? ['Mutton Curry', 'Rice', 'Naan', 'Onion Salad']
            : ['Butter Chicken', 'Jeera Rice', 'Roti', 'Green Salad'],
        },
        {
          date: dateStr,
          mealType: 'LUNCH',
          categoryName: 'Halal',
          items: dayOffset % 2 === 0 
            ? ['Biryani', 'Raita', 'Shorba', 'Kebab']
            : ['Halal Chicken Curry', 'Pulao', 'Raita', 'Seekh Kebab'],
        },
        {
          date: dateStr,
          mealType: 'LUNCH',
          categoryName: 'Vegan Special',
          items: dayOffset % 2 === 0 
            ? ['Quinoa Bowl', 'Roasted Vegetables', 'Hummus', 'Salad']
            : ['Buddha Bowl', 'Grilled Tofu', 'Tahini Dressing', 'Mixed Greens'],
        }
      );

      // Dinner plans - 3 options per day
      mealPlans.push(
        {
          date: dateStr,
          mealType: 'DINNER',
          categoryName: 'South Indian Non Veg',
          items: dayOffset % 2 === 0 
            ? ['Fish Curry', 'Rice', 'Rasam', 'Vegetable Fry']
            : ['Chicken Chettinad', 'Rice', 'Sambar', 'Beans Fry'],
        },
        {
          date: dateStr,
          mealType: 'DINNER',
          categoryName: 'North Indian Veg',
          items: dayOffset % 3 === 0 
            ? ['Rajma', 'Rice', 'Roti', 'Salad']
            : dayOffset % 3 === 1
            ? ['Dal Makhani', 'Rice', 'Naan', 'Pickle']
            : ['Palak Paneer', 'Jeera Rice', 'Roti', 'Raita'],
        },
        {
          date: dateStr,
          mealType: 'DINNER',
          categoryName: 'Continental',
          items: dayOffset % 3 === 0 
            ? ['Pasta', 'Garlic Bread', 'Salad', 'Juice']
            : dayOffset % 3 === 1
            ? ['Pizza', 'Garlic Bread', 'Coleslaw', 'Cold Drink']
            : ['Grilled Sandwich', 'French Fries', 'Salad', 'Smoothie'],
        }
      );
    }

    // Create meal plans
    let createdCount = 0;
    let existingCount = 0;

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
          existingCount++;
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
        createdCount++;
      } catch (error) {
        console.error(`❌ Error creating meal plan ${plan.date} ${plan.mealType} ${plan.categoryName}:`, error.message);
      }
    }

    // Get student count for this university
    const studentCount = await prisma.user.count({
      where: {
        universityId: university.id,
        role: 'STUDENT',
        status: 'APPROVED',
      },
    });

    console.log('🎉 Sample meal plans setup completed!');
    console.log(`📊 Summary for ${university.name}:`);
    console.log(`   - Categories: ${createdCategories.length}`);
    console.log(`   - New meal plans created: ${createdCount}`);
    console.log(`   - Existing meal plans: ${existingCount}`);
    console.log(`   - Students in university: ${studentCount}`);
    console.log(`👨‍🏫 Manager: ${manager.name} (${manager.email})`);
    
    if (studentCount > 0) {
      console.log('✨ Students can now access meal planning at: /student/meal-planning');
    } else {
      console.log('⚠️  No approved students found. Students need to register and be approved by the manager first.');
    }
    
  } catch (error) {
    console.error('❌ Error adding meal plans for manager:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Get manager email from command line argument or use default
const managerEmail = process.argv[2] || 'rajesh@aieraa.com';
addMealPlansForManager(managerEmail); 