import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// Cloudinary configuration
const CLOUDINARY_CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY
const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET

if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
  throw new Error('Missing Cloudinary environment variables')
}

// Helper function to generate signature for Cloudinary
function generateSignature(params: any, apiSecret: string) {
  const crypto = require('crypto')
  
  // Sort parameters and create string
  const sortedParams = Object.keys(params)
    .sort()
    .map(key => `${key}=${params[key]}`)
    .join('&')
  
  // Create signature
  return crypto
    .createHash('sha1')
    .update(sortedParams + apiSecret)
    .digest('hex')
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get form data
    const formData = await request.formData()
    const file = formData.get('file') as File
    const folder = formData.get('folder') as string || 'general'
    const resourceType = formData.get('resource_type') as string || 'image'

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'File must be an image' }, { status: 400 })
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'File size must be less than 5MB' }, { status: 400 })
    }

    // Generate unique filename
    const timestamp = Math.round(Date.now() / 1000)
    const publicId = `${folder}/${session.user.id}-${timestamp}`

    // Prepare upload parameters for signature (must match exactly what's sent to Cloudinary)
    const signatureParams = {
      timestamp: timestamp,
      public_id: publicId,
      folder: `aieraa-hostel/${folder}`
    }

    // Generate signature
    const signature = generateSignature(signatureParams, CLOUDINARY_API_SECRET!)

    // Debug logging
    console.log('📤 Cloudinary upload parameters:', {
      timestamp,
      publicId,
      folder: `aieraa-hostel/${folder}`,
      signatureParams
    })

    // Create form data for Cloudinary
    const cloudinaryFormData = new FormData()
    cloudinaryFormData.append('file', file)
    cloudinaryFormData.append('timestamp', timestamp.toString())
    cloudinaryFormData.append('public_id', publicId)
    cloudinaryFormData.append('folder', `aieraa-hostel/${folder}`)
    cloudinaryFormData.append('api_key', CLOUDINARY_API_KEY!)
    cloudinaryFormData.append('signature', signature)

    // Upload to Cloudinary
    const cloudinaryResponse = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME!}/image/upload`,
      {
        method: 'POST',
        body: cloudinaryFormData
      }
    )

    if (!cloudinaryResponse.ok) {
      const errorText = await cloudinaryResponse.text()
      console.error('Cloudinary upload error:', errorText)
      
      // Try to parse error for better user feedback
      try {
        const errorData = JSON.parse(errorText)
        console.error('Cloudinary error details:', errorData)
        return NextResponse.json({ 
          error: 'Failed to upload image', 
          details: errorData.error?.message || 'Unknown error' 
        }, { status: 500 })
      } catch (parseError) {
        return NextResponse.json({ 
          error: 'Failed to upload image', 
          details: errorText 
        }, { status: 500 })
      }
    }

    const cloudinaryData = await cloudinaryResponse.json()

    // Return secure URL
    return NextResponse.json({
      success: true,
      url: cloudinaryData.secure_url,
      publicId: cloudinaryData.public_id,
      width: cloudinaryData.width,
      height: cloudinaryData.height,
      format: cloudinaryData.format,
      bytes: cloudinaryData.bytes
    })

  } catch (error) {
    console.error('Upload API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 