// API Route: Verify WhatsApp OTP and Authenticate
// File: src/app/api/auth/whatsapp/verify-otp/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { sign } from 'jsonwebtoken'
import whatsappOTPService from '@/lib/whatsapp-otp'

// Request validation schema
const verifyOTPSchema = z.object({
  phone: z.string().min(10, 'Phone number must be at least 10 digits'),
  otp: z.string().length(6, 'OTP must be 6 digits')
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate request data
    const validation = verifyOTPSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid phone number or OTP format',
          details: validation.error.issues 
        },
        { status: 400 }
      )
    }

    const { phone, otp } = validation.data

    // Verify OTP
    const result = await whatsappOTPService.verifyOTP(phone, otp)

    if (!result.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: result.error 
        },
        { status: 400 }
      )
    }

    // Create JWT token for authentication
    const token = sign(
      { 
        userId: result.user?.id,
        phone: result.user?.phone,
        role: result.user?.role 
      },
      process.env.NEXTAUTH_SECRET || 'fallback-secret',
      { expiresIn: '7d' }
    )

    // Set secure HTTP-only cookie
    const response = NextResponse.json({
      success: true,
      message: 'Login successful',
      user: {
        id: result.user?.id,
        name: result.user?.name,
        phone: result.user?.phone,
        role: result.user?.role,
        universityId: result.user?.universityId
      },
      isNewUser: result.isNewUser,
      redirectTo: result.isNewUser ? '/student/profile' : '/student'
    })

    // Set JWT token as HTTP-only cookie
    response.cookies.set('whatsapp-auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/'
    })

    return response

  } catch (error) {
    console.error('Verify OTP API error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error' 
      },
      { status: 500 }
    )
  }
} 