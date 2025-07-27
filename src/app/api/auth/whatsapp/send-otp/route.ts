// API Route: Send WhatsApp OTP for Login
// File: src/app/api/auth/whatsapp/send-otp/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import whatsappOTPService from '@/lib/whatsapp-otp'

// Request validation schema
const sendOTPSchema = z.object({
  phone: z.string().min(10, 'Phone number must be at least 10 digits')
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate request data
    const validation = sendOTPSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid phone number format',
          details: validation.error.issues 
        },
        { status: 400 }
      )
    }

    const { phone } = validation.data

    // Send OTP
    const result = await whatsappOTPService.sendOTP(phone)

    if (!result.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: result.error 
        },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'OTP sent successfully to your WhatsApp',
      expiresAt: result.expiresAt,
      expiresInMinutes: 10
    })

  } catch (error) {
    console.error('Send OTP API error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error' 
      },
      { status: 500 }
    )
  }
} 