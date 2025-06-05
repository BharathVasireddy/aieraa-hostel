import { PrismaClient, UserRole, UserStatus, MenuCategory } from '../src/generated/prisma'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seed...')

  // Create universities
  const universities = await Promise.all([
    // Add DEMO university first
    prisma.university.upsert({
      where: { code: 'DEMO' },
      update: {},
      create: {
        name: 'Demo University',
        code: 'DEMO',
        address: '123 Demo Street, Demo City',
        contactInfo: 'info@demo.edu',
        isActive: true,
        settings: {
          create: {
            cutoffHours: 22,
            maxAdvanceOrderDays: 7,
            minAdvanceOrderHours: 12,
            allowWeekendOrders: true,
            taxRate: 0.05 // 5% tax
          }
        }
      },
      include: { settings: true }
    }),
    prisma.university.upsert({
      where: { code: 'CTUMP' },
      update: {},
      create: {
        name: 'Can Tho University of Medicine and Pharmacy',
        code: 'CTUMP',
        address: '179 Nguyen Van Cu Street, Can Tho City, Vietnam',
        contactInfo: 'info@ctump.edu.vn',
        isActive: true,
        settings: {
          create: {
            cutoffHours: 22,
            maxAdvanceOrderDays: 7,
            minAdvanceOrderHours: 12,
            allowWeekendOrders: true,
            taxRate: 0.10 // 10% VAT Vietnam
          }
        }
      },
      include: { settings: true }
    }),
    prisma.university.upsert({
      where: { code: 'PCTU' },
      update: {},
      create: {
        name: 'Pham Ngoc Thach University of Medicine',
        code: 'PCTU',
        address: '86 Nguyen Dinh Chieu Street, Ho Chi Minh City, Vietnam',
        contactInfo: 'info@pnt.edu.vn',
        isActive: true,
        settings: {
          create: {
            cutoffHours: 21,
            maxAdvanceOrderDays: 5,
            minAdvanceOrderHours: 8,
            allowWeekendOrders: true,
            taxRate: 0.10 // 10% VAT Vietnam
          }
        }
      },
      include: { settings: true }
    }),
    prisma.university.upsert({
      where: { code: 'DNU' },
      update: {},
      create: {
        name: 'Duy Tan University',
        code: 'DNU',
        address: '254 Nguyen Van Linh Street, Da Nang City, Vietnam',
        contactInfo: 'info@duytan.edu.vn',
        isActive: true,
        settings: {
          create: {
            cutoffHours: 22,
            maxAdvanceOrderDays: 6,
            minAdvanceOrderHours: 10,
            allowWeekendOrders: true,
            taxRate: 0.10 // 10% VAT Vietnam
          }
        }
      },
      include: { settings: true }
    }),
    prisma.university.upsert({
      where: { code: 'BMU' },
      update: {},
      create: {
        name: 'Baku Medical University',
        code: 'BMU',
        address: '23 Gasim Ismayilov Street, Baku, Azerbaijan',
        contactInfo: 'info@bmu.edu.az',
        isActive: true,
        settings: {
          create: {
            cutoffHours: 21,
            maxAdvanceOrderDays: 7,
            minAdvanceOrderHours: 12,
            allowWeekendOrders: false,
            taxRate: 0.18 // 18% VAT Azerbaijan
          }
        }
      },
      include: { settings: true }
    })
  ])

  console.log(`✅ Created ${universities.length} universities`)

  // Create admin users
  const hashedPassword = await bcrypt.hash('admin123', 12)
  
  const adminUsers = await Promise.all(
    universities.map(university =>
      prisma.user.upsert({
        where: { email: `admin@${university.code.toLowerCase()}.edu` },
        update: {},
        create: {
          email: `admin@${university.code.toLowerCase()}.edu`,
          password: hashedPassword,
          name: `${university.name} Admin`,
          role: UserRole.ADMIN,
          status: UserStatus.APPROVED,
          universityId: university.id,
          phone: '+1-555-0100'
        }
      })
    )
  )

  console.log(`✅ Created ${adminUsers.length} admin users`)

  // Create sample menu items for Demo University
  const demoUniversity = universities.find(u => u.code === 'DEMO')
  if (demoUniversity) {
    const menuItems = await Promise.all([
      // Breakfast items
      prisma.menuItem.create({
        data: {
          name: 'Masala Dosa',
          description: 'Crispy rice crepe with spiced potato filling',
          basePrice: 45.00,
          categories: [MenuCategory.BREAKFAST],
          isVegetarian: true,
          isVegan: false,
          allergens: [],
          universityId: demoUniversity.id,
          calories: 350,
          protein: 8.5,
          carbs: 58.0,
          fat: 12.0
        }
      }),
      prisma.menuItem.create({
        data: {
          name: 'Poha',
          description: 'Flattened rice with onions, peas and spices',
          basePrice: 25.00,
          categories: [MenuCategory.BREAKFAST],
          isVegetarian: true,
          isVegan: true,
          allergens: [],
          universityId: demoUniversity.id,
          calories: 250,
          protein: 6.0,
          carbs: 45.0,
          fat: 5.0
        }
      }),
      // Lunch items
      prisma.menuItem.create({
        data: {
          name: 'Dal Rice',
          description: 'Lentil curry with steamed rice',
          basePrice: 60.00,
          categories: [MenuCategory.LUNCH],
          isVegetarian: true,
          isVegan: true,
          allergens: [],
          universityId: demoUniversity.id,
          calories: 400,
          protein: 15.0,
          carbs: 65.0,
          fat: 8.0
        }
      }),
      prisma.menuItem.create({
        data: {
          name: 'Chicken Biryani',
          description: 'Fragrant rice with spiced chicken',
          basePrice: 120.00,
          categories: [MenuCategory.LUNCH],
          isVegetarian: false,
          isVegan: false,
          allergens: ['dairy'],
          universityId: demoUniversity.id,
          calories: 550,
          protein: 25.0,
          carbs: 70.0,
          fat: 18.0
        }
      }),
      // Dinner items
      prisma.menuItem.create({
        data: {
          name: 'Roti with Curry',
          description: 'Fresh wheat bread with mixed vegetable curry',
          basePrice: 55.00,
          categories: [MenuCategory.DINNER],
          isVegetarian: true,
          isVegan: false,
          allergens: ['gluten'],
          universityId: demoUniversity.id,
          calories: 380,
          protein: 12.0,
          carbs: 55.0,
          fat: 10.0
        }
      }),
      // Beverages
      prisma.menuItem.create({
        data: {
          name: 'Masala Chai',
          description: 'Spiced tea with milk',
          basePrice: 15.00,
          categories: [MenuCategory.BEVERAGES],
          isVegetarian: true,
          isVegan: false,
          allergens: ['dairy'],
          universityId: demoUniversity.id,
          calories: 80,
          protein: 2.0,
          carbs: 12.0,
          fat: 3.0
        }
      })
    ])

    console.log(`✅ Created ${menuItems.length} menu items for Demo University`)

    // Create availability for next 7 days for all menu items
    const today = new Date()
    const availabilityPromises = []

    for (let i = 0; i < 7; i++) {
      const date = new Date(today)
      date.setDate(today.getDate() + i)
      
      for (const menuItem of menuItems) {
        availabilityPromises.push(
          prisma.menuItemAvailability.create({
            data: {
              menuItemId: menuItem.id,
              date: date,
              isAvailable: true,
              maxQuantity: 50
            }
          })
        )
      }
    }

    await Promise.all(availabilityPromises)
    console.log(`✅ Created availability for next 7 days`)

    // Create a demo student user
    const studentPassword = await bcrypt.hash('student123', 12)
    const demoStudent = await prisma.user.upsert({
      where: { email: 'student@demo.edu' },
      update: {},
      create: {
        email: 'student@demo.edu',
        password: studentPassword,
        name: 'Demo Student',
        role: UserRole.STUDENT,
        status: UserStatus.APPROVED,
        universityId: demoUniversity.id,
        studentId: 'DEMO2024001',
        roomNumber: 'A-101',
        course: 'Computer Science',
        year: 3,
        phone: '+1-555-0123',
        dietaryPreferences: ['vegetarian']
      }
    })

    console.log('✅ Created demo student user')
  } else {
    console.log('❌ Demo university not found - skipping menu items and demo student')
  }

  console.log('🎉 Database seed completed successfully!')
  console.log('\n📧 Login Credentials:')
  console.log('Admin: admin@demo.edu / admin123')
  console.log('Student: student@demo.edu / student123')
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  }) 