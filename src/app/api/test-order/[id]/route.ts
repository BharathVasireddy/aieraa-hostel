import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params

    if (id === 'seed') {
      // Seed demo users
      console.log('🌱 Starting demo user seeding...')

      // Check if demo users already exist
      const existingAdmin = await prisma.user.findUnique({
        where: { email: 'admin@bmu.edu.vn' }
      })

      if (existingAdmin) {
        return NextResponse.json({
          success: true,
          message: 'Demo users already exist',
          accounts: {
            admin: { email: 'admin@bmu.edu.vn', password: 'admin123' },
            student: { email: 'student@bmu.edu.vn', password: 'student123' }
          }
        })
      }

      // Create demo university
      const demoUniversity = await prisma.university.upsert({
        where: { code: 'BMU' },
        update: {},
        create: {
          name: 'Bharath Malpe University',
          code: 'BMU',
          address: 'Malpe, Karnataka',
          isActive: true
        }
      })

      // Hash passwords
      const hashedAdminPassword = await bcrypt.hash('admin123', 12)
      const hashedStudentPassword = await bcrypt.hash('student123', 12)

      // Create demo admin
      await prisma.user.create({
        data: {
          email: 'admin@bmu.edu.vn',
          password: hashedAdminPassword,
          name: 'Demo Admin',
          role: 'ADMIN',
          status: 'APPROVED',
          universityId: demoUniversity.id,
          roomNumber: 'A001',
          phone: '+91 9876543210'
        }
      })

      // Create demo student
      await prisma.user.create({
        data: {
          email: 'student@bmu.edu.vn',
          password: hashedStudentPassword,
          name: 'Demo Student',
          role: 'STUDENT',
          status: 'APPROVED',
          universityId: demoUniversity.id,
          roomNumber: '201',
          phone: '+91 9876543211'
        }
      })

      // Create some demo menu items
      const menuItems = await prisma.menuItem.createMany({
        data: [
          {
            name: 'Masala Dosa',
            description: 'Crispy rice crepe with spiced potato filling',
            basePrice: 45.00,
            categories: ['BREAKFAST'],
            isVegetarian: true,
            isVegan: false,
            allergens: [],
            universityId: demoUniversity.id,
            calories: 350,
            protein: 8.5,
            carbs: 58.0,
            fat: 12.0,
            isActive: true
          },
          {
            name: 'Chicken Biryani',
            description: 'Aromatic basmati rice with tender chicken pieces',
            basePrice: 120.00,
            categories: ['LUNCH', 'DINNER'],
            isVegetarian: false,
            isVegan: false,
            allergens: [],
            universityId: demoUniversity.id,
            calories: 650,
            protein: 35.0,
            carbs: 75.0,
            fat: 18.0,
            isActive: true
          },
          {
            name: 'Paneer Butter Masala',
            description: 'Creamy tomato-based curry with paneer cubes',
            basePrice: 85.00,
            categories: ['LUNCH', 'DINNER'],
            isVegetarian: true,
            isVegan: false,
            allergens: ['dairy'],
            universityId: demoUniversity.id,
            calories: 420,
            protein: 18.0,
            carbs: 25.0,
            fat: 28.0,
            isActive: true
          },
          {
            name: 'Samosa Chat',
            description: 'Crispy samosas topped with chutneys and spices',
            basePrice: 35.00,
            categories: ['SNACKS'],
            isVegetarian: true,
            isVegan: true,
            allergens: [],
            universityId: demoUniversity.id,
            calories: 280,
            protein: 6.0,
            carbs: 35.0,
            fat: 12.0,
            isActive: true
          }
        ]
      })

      return NextResponse.json({
        success: true,
        message: 'Demo users and data created successfully!',
        accounts: {
          admin: { 
            email: 'admin@bmu.edu.vn', 
            password: 'admin123',
            role: 'ADMIN',
            url: 'https://hostel.aieraa.com/admin'
          },
          student: { 
            email: 'student@bmu.edu.vn', 
            password: 'student123',
            role: 'STUDENT',
            url: 'https://hostel.aieraa.com/student'
          }
        },
        university: demoUniversity.name,
        menuItems: menuItems.count
      })

    } else if (id === 'test') {
      // Simple database test
      const userCount = await prisma.user.count()
      const universityCount = await prisma.university.count()
      
      return NextResponse.json({
        success: true,
        message: 'Database connection working!',
        data: {
          users: userCount,
          universities: universityCount,
          database: 'Connected to Neon PostgreSQL'
        }
      })
    }

    return NextResponse.json({
      error: 'Invalid endpoint. Use /test or /seed'
    }, { status: 400 })

  } catch (error) {
    console.error('❌ API error:', error)
    return NextResponse.json({
      success: false,
      error: 'API error occurred',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
} 