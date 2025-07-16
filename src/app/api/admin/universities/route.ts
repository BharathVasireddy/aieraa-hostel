import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/admin/universities - Get all universities (Super Admin only)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get current user
    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Only ADMIN (Super Admin) can manage universities
    if (currentUser.role !== 'ADMIN') {
      return NextResponse.json({ 
        error: 'Access denied. Super Admin privileges required.' 
      }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const includeInactive = searchParams.get('includeInactive') === 'true'

    // Build where clause
    const whereClause: any = {}
    if (!includeInactive) {
      whereClause.isActive = true
    }

    const universities = await prisma.university.findMany({
      where: whereClause,
      include: {
        settings: true,
        _count: {
          select: {
            users: {
              where: { role: 'STUDENT', status: 'APPROVED' }
            },
            orders: true,
            menuItems: { where: { isActive: true } }
          }
        },
        users: {
          where: {
            role: { in: ['MANAGER', 'CATERER'] }
          },
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            status: true,
            createdAt: true
          }
        }
      },
      orderBy: [
        { isActive: 'desc' },
        { createdAt: 'desc' }
      ]
    })

    return NextResponse.json({
      success: true,
      universities: universities.map(uni => ({
        ...uni,
        stats: {
          activeStudents: uni._count.users,
          totalOrders: uni._count.orders,
          activeMenuItems: uni._count.menuItems
        }
      }))
    })

  } catch (error) {
    console.error('Error fetching universities:', error)
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    })
    return NextResponse.json(
      { 
        error: 'Failed to fetch universities',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// POST /api/admin/universities - Create new university (Super Admin only)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get current user
    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Only ADMIN (Super Admin) can create universities
    if (currentUser.role !== 'ADMIN') {
      return NextResponse.json({ 
        error: 'Access denied. Super Admin privileges required.' 
      }, { status: 403 })
    }

    const body = await request.json()
    const { name, code, city } = body

    // Validate required fields
    if (!name || !code || !city) {
      return NextResponse.json(
        { error: 'University name, code, and city are required' },
        { status: 400 }
      )
    }

    // Validate code format
    const codeRegex = /^[A-Z0-9]{2,10}$/
    if (!codeRegex.test(code)) {
      return NextResponse.json(
        { error: 'University code must be 2-10 characters, uppercase letters and numbers only' },
        { status: 400 }
      )
    }

    // Check if university name already exists
    const existingUniversity = await prisma.university.findUnique({
      where: { name }
    })

    if (existingUniversity) {
      return NextResponse.json(
        { error: 'University with this name already exists' },
        { status: 400 }
      )
    }

    // Check if university code already exists
    const existingCode = await prisma.university.findUnique({
      where: { code }
    })

    if (existingCode) {
      return NextResponse.json(
        { error: 'University code already exists. Please choose a different code.' },
        { status: 400 }
      )
    }

    // Create university with default settings
    const university = await prisma.university.create({
      data: {
        name,
        code,
        city,
        isActive: true,
        settings: {
          create: {
            cutoffHours: 22, // 10 PM default
            maxAdvanceOrderDays: 7,
            minAdvanceOrderHours: 12,
            allowWeekendOrders: true,
            baseTaxRate: 0.0,
            serviceTaxRate: 0.0,
            additionalTaxes: undefined
          }
        }
      },
      include: {
        settings: true
      }
    })

    console.log(`✅ University created: ${university.name} (${university.code}) by Super Admin: ${currentUser.name}`)

    return NextResponse.json({
      success: true,
      message: 'University created successfully',
      university
    })

  } catch (error) {
    console.error('Error creating university:', error)
    return NextResponse.json(
      { error: 'Failed to create university' },
      { status: 500 }
    )
  }
} 