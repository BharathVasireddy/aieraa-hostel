import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@/generated/prisma'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    // Check if demo user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: 'student@demo.edu' }
    })

    if (existingUser) {
      return NextResponse.json({
        success: true,
        message: 'Demo user already exists',
        userId: existingUser.id
      })
    }

    // Get a university
    const university = await prisma.university.findFirst({
      where: { isActive: true }
    })

    if (!university) {
      return NextResponse.json({ error: 'No active university found' }, { status: 400 })
    }

    // Create demo user
    const hashedPassword = await bcrypt.hash('student123', 12)
    
    const user = await prisma.user.create({
      data: {
        email: 'student@demo.edu',
        password: hashedPassword,
        name: 'Demo Student',
        phone: '+91-9876543210',
        role: 'STUDENT',
        status: 'APPROVED',
        universityId: university.id,
        studentId: 'ST202300123',
        roomNumber: 'A-101'
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Demo user created',
      userId: user.id
    })

  } catch (error) {
    console.error('Error creating demo user:', error)
    return NextResponse.json(
      { error: 'Failed to create demo user' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
} 