import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

// POST /api/admin/universities/[id]/staff - Assign staff (manager/caterer) to university
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!currentUser || currentUser.role !== 'ADMIN') {
      return NextResponse.json({ 
        error: 'Access denied. Super Admin privileges required.' 
      }, { status: 403 })
    }

    const { id: universityId } = await params
    const body = await request.json()
    const { name, email, role, phone, password } = body

    // Validate required fields
    if (!name || !email || !role || !password) {
      return NextResponse.json(
        { error: 'Name, email, role, and password are required' },
        { status: 400 }
      )
    }

    // Validate role
    if (!['MANAGER', 'CATERER'].includes(role)) {
      return NextResponse.json(
        { error: 'Role must be either MANAGER or CATERER' },
        { status: 400 }
      )
    }

    // Check if university exists and is active
    const university = await prisma.university.findUnique({
      where: { id: universityId }
    })

    if (!university) {
      return NextResponse.json({ error: 'University not found' }, { status: 404 })
    }

    if (!university.isActive) {
      return NextResponse.json(
        { error: 'Cannot assign staff to inactive university' },
        { status: 400 }
      )
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Create staff user
    const staffUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: role as 'MANAGER' | 'CATERER',
        status: 'APPROVED', // Staff are auto-approved
        universityId,
        phone: phone || null
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        phone: true,
        createdAt: true,
        university: {
          select: {
            id: true,
            name: true,
            code: true
          }
        }
      }
    })

    console.log(`✅ ${role} assigned to university: ${university.name} - ${staffUser.name} (${staffUser.email}) by Super Admin: ${currentUser.name}`)

    return NextResponse.json({
      success: true,
      message: `${role.toLowerCase()} assigned successfully`,
      user: staffUser
    })

  } catch (error) {
    console.error('Error assigning staff:', error)
    return NextResponse.json(
      { error: 'Failed to assign staff to university' },
      { status: 500 }
    )
  }
}

// GET /api/admin/universities/[id]/staff - Get all staff for university
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!currentUser || currentUser.role !== 'ADMIN') {
      return NextResponse.json({ 
        error: 'Access denied. Super Admin privileges required.' 
      }, { status: 403 })
    }

    const { id: universityId } = await params
    const { searchParams } = new URL(request.url)
    const roleFilter = searchParams.get('role') // 'MANAGER' | 'CATERER' | null

    // Check if university exists
    const university = await prisma.university.findUnique({
      where: { id: universityId }
    })

    if (!university) {
      return NextResponse.json({ error: 'University not found' }, { status: 404 })
    }

    // Build where clause
    const whereClause: any = {
      universityId,
      role: { in: ['MANAGER', 'CATERER'] }
    }

    if (roleFilter && ['MANAGER', 'CATERER'].includes(roleFilter)) {
      whereClause.role = roleFilter
    }

    const staff = await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        phone: true,
        createdAt: true,
        lastLoginAt: true
      },
      orderBy: [
        { role: 'asc' }, // CATERER first, then MANAGER
        { createdAt: 'desc' }
      ]
    })

    return NextResponse.json({
      success: true,
      university: {
        id: university.id,
        name: university.name,
        code: university.code
      },
      staff
    })

  } catch (error) {
    console.error('Error fetching university staff:', error)
    return NextResponse.json(
      { error: 'Failed to fetch university staff' },
      { status: 500 }
    )
  }
} 