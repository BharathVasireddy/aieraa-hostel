import { NextRequest, NextResponse } from 'next/server'
import { whatsappService } from '@/lib/whatsapp'

// WhatsApp webhook verification (GET request)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const mode = searchParams.get('hub.mode')
    const token = searchParams.get('hub.verify_token')
    const challenge = searchParams.get('hub.challenge')

    console.log('🔐 WhatsApp webhook verification:', { mode, token, challenge })

    // Verify the webhook
    if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
      console.log('✅ WhatsApp webhook verified successfully')
      return new NextResponse(challenge, { status: 200 })
    } else {
      console.log('❌ WhatsApp webhook verification failed')
      return NextResponse.json({ error: 'Verification failed' }, { status: 403 })
    }
  } catch (error) {
    console.error('WhatsApp webhook verification error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Handle incoming WhatsApp messages (POST request)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    console.log('📨 WhatsApp webhook received:', JSON.stringify(body, null, 2))

    // Verify the request is from WhatsApp
    const signature = request.headers.get('x-hub-signature-256')
    if (!signature) {
      console.log('❌ No signature found in WhatsApp webhook')
      return NextResponse.json({ error: 'No signature' }, { status: 401 })
    }

    // Process the webhook
    const result = await whatsappService.handleWebhook(body)

    if (result.success) {
      console.log('✅ WhatsApp webhook processed successfully')
      return NextResponse.json({ status: 'ok' }, { status: 200 })
    } else {
      console.log('❌ WhatsApp webhook processing failed:', result.error)
      return NextResponse.json({ error: 'Processing failed' }, { status: 500 })
    }
  } catch (error) {
    console.error('WhatsApp webhook processing error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Health check endpoint
export async function HEAD() {
  return new NextResponse(null, { status: 200 })
} 