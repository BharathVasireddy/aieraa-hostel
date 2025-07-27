// Test endpoint for WhatsApp OTP Login functionality
// File: src/app/api/auth/whatsapp/test/route.ts

import { NextRequest, NextResponse } from 'next/server'
import whatsappOTPService from '@/lib/whatsapp-otp'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action') || 'info'
    const phone = searchParams.get('phone')
    const otp = searchParams.get('otp')

    switch (action) {
      case 'info':
        return NextResponse.json({
          message: 'WhatsApp OTP Login Test Endpoint',
          availableActions: [
            'send - Send OTP to a phone number (requires ?phone=xxxxxxxxxx)',
            'verify - Verify OTP (requires ?phone=xxxxxxxxxx&otp=xxxxxx)',
            'cleanup - Clean up expired OTPs',
            'status - Check service status'
          ],
          example: '/api/auth/whatsapp/test?action=send&phone=8885333635'
        })

      case 'send':
        if (!phone) {
          return NextResponse.json(
            { error: 'Phone parameter is required' },
            { status: 400 }
          )
        }

        const sendResult = await whatsappOTPService.sendOTP(phone)
        return NextResponse.json({
          action: 'send',
          phone,
          ...sendResult
        })

      case 'verify':
        if (!phone || !otp) {
          return NextResponse.json(
            { error: 'Both phone and otp parameters are required' },
            { status: 400 }
          )
        }

        const verifyResult = await whatsappOTPService.verifyOTP(phone, otp)
        return NextResponse.json({
          action: 'verify',
          phone,
          otp,
          ...verifyResult
        })

      case 'cleanup':
        await whatsappOTPService.cleanupExpiredOTPs()
        return NextResponse.json({
          action: 'cleanup',
          message: 'Expired OTPs cleaned up successfully'
        })

      case 'status':
        const hasWatiConfig = !!(process.env.WATI_API_URL && process.env.WATI_ACCESS_TOKEN)
        const hasTemplateNamespace = !!process.env.WATI_TEMPLATE_NAMESPACE
        
        return NextResponse.json({
          action: 'status',
          service: 'WhatsApp OTP Login',
          configuration: {
            watiConfigured: hasWatiConfig,
            templateNamespace: hasTemplateNamespace,
            templateName: 'aieraa_food_login_otp',
            otpExpiryMinutes: 10,
            maxAttempts: 3
          },
          endpoints: {
            sendOTP: '/api/auth/whatsapp/send-otp',
            verifyOTP: '/api/auth/whatsapp/verify-otp'
          }
        })

      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: info, send, verify, cleanup, or status' },
          { status: 400 }
        )
    }

  } catch (error) {
    console.error('WhatsApp test endpoint error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, phone, otp } = body

    if (action === 'send') {
      if (!phone) {
        return NextResponse.json(
          { error: 'Phone is required' },
          { status: 400 }
        )
      }

      const result = await whatsappOTPService.sendOTP(phone)
      return NextResponse.json({
        action: 'send',
        phone,
        timestamp: new Date().toISOString(),
        ...result
      })
    }

    if (action === 'verify') {
      if (!phone || !otp) {
        return NextResponse.json(
          { error: 'Phone and OTP are required' },
          { status: 400 }
        )
      }

      const result = await whatsappOTPService.verifyOTP(phone, otp)
      return NextResponse.json({
        action: 'verify',
        phone,
        otp,
        timestamp: new Date().toISOString(),
        ...result
      })
    }

    return NextResponse.json(
      { error: 'Invalid action. Use send or verify' },
      { status: 400 }
    )

  } catch (error) {
    console.error('WhatsApp test POST error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
} 