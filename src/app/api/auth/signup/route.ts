import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { UserRole, UserStatus } from '@/generated/prisma'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      name, 
      email, 
      password, 
      universityId, 
      studentId, 
      roomNumber, 
      phone, 
      role = 'STUDENT' 
    } = body

    // Validation
    if (!name || !email || !password || !universityId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Only allow STUDENT role for public registration
    if (role !== 'STUDENT') {
      return NextResponse.json(
        { error: 'Only student registration is allowed' },
        { status: 400 }
      )
    }

    // Additional validation for student fields
    if (!studentId || !roomNumber || !phone) {
      return NextResponse.json(
        { error: 'Student ID, room number, and phone are required for student registration' },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long' },
        { status: 400 }
      )
    }

    // Validate phone number (Indian or Vietnamese)
    const phonePattern = /^(\+?91|0)?[6-9]\d{9}$|^(\+?84|0)?[1-9]\d{8}$/
    if (!phonePattern.test(phone.replace(/\D/g, ''))) {
      return NextResponse.json(
        { error: 'Please enter a valid Indian or Vietnamese phone number' },
        { status: 400 }
      )
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      )
    }

    // Check if university exists
    const university = await prisma.university.findUnique({
      where: { id: universityId }
    })

    if (!university) {
      return NextResponse.json(
        { error: 'Invalid university selected' },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: UserRole.STUDENT, // Always STUDENT for public registration
        status: UserStatus.PENDING, // Requires admin approval
        universityId,
        studentId,
        roomNumber,
        phone
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        createdAt: true
      }
    })

    return NextResponse.json({
      message: 'Student account created successfully. Please wait for admin approval.',
      user
    })

  } catch (error) {
    console.error('Signup error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 