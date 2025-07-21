import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

// Validation schemas
const RecurringPatternSchema = z.object({
  days: z.array(z.string()).min(1, 'At least one day required'),
  startDate: z.string(),
  endDate: z.string()
})

const DateRangeSchema = z.object({
  startDate: z.string(),
  endDate: z.string()
})

const SpecificDatesSchema = z.object({
  dates: z.array(z.string()).min(1, 'At least one date required')
})

const SetAvailabilitySchema = z.object({
  menuItemId: z.string(),
  mode: z.enum(['recurring', 'dateRange', 'specificDates']),
  isAvailable: z.boolean().default(true),
  recurringPattern: RecurringPatternSchema.optional(),
  dateRange: DateRangeSchema.optional(),
  specificDates: SpecificDatesSchema.optional()
})

// POST: Set availability for menu item
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'MANAGER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, role: true, universityId: true, name: true }
    })

    if (!currentUser || !currentUser.universityId) {
      return NextResponse.json({ error: 'Manager university not found' }, { status: 404 })
    }

    const resolvedParams = await params
    const menuItemId = resolvedParams.id

    // Verify menu item belongs to manager's university
    const menuItem = await prisma.menuItem.findUnique({
      where: { id: menuItemId },
      select: { id: true, name: true, universityId: true }
    })

    if (!menuItem) {
      return NextResponse.json({ error: 'Menu item not found' }, { status: 404 })
    }

    if (menuItem.universityId !== currentUser.universityId) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Parse and validate request body
    const body = await request.json()
    const validatedData = SetAvailabilitySchema.parse(body)

    // Generate dates based on the mode
    let datesToSet: Date[] = []

    if (validatedData.mode === 'recurring' && validatedData.recurringPattern) {
      datesToSet = generateRecurringDates(validatedData.recurringPattern)
    } else if (validatedData.mode === 'dateRange' && validatedData.dateRange) {
      datesToSet = generateDateRangeDates(validatedData.dateRange)
    } else if (validatedData.mode === 'specificDates' && validatedData.specificDates) {
      datesToSet = validatedData.specificDates.dates.map(dateStr => new Date(dateStr))
    }

    if (datesToSet.length === 0) {
      return NextResponse.json({ error: 'No valid dates generated' }, { status: 400 })
    }

    // Use transaction to ensure data consistency
    const result = await prisma.$transaction(async (tx) => {
      // First, remove existing availability records for future dates
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      await tx.menuItemAvailability.deleteMany({
        where: {
          menuItemId: menuItemId,
          date: { gte: today }
        }
      })

      // Create new availability records
      const availabilityRecords = datesToSet.map(date => ({
        menuItemId: menuItemId,
        date: date,
        isAvailable: validatedData.isAvailable,
        maxQuantity: null,
        currentQuantity: 0
      }))

      await tx.menuItemAvailability.createMany({
        data: availabilityRecords,
        skipDuplicates: true
      })

      return availabilityRecords.length
    })

    // Log the action
    console.log(`Manager ${currentUser.name} set availability for ${menuItem.name}: ${validatedData.mode} mode, ${result} dates`)

    return NextResponse.json({
      success: true,
      message: `Availability set for ${result} dates`,
      datesCount: result,
      mode: validatedData.mode
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: 'Invalid request data',
        details: error.issues 
      }, { status: 400 })
    }

    console.error('Set availability API error:', error)
    return NextResponse.json(
      { error: 'Failed to set availability' },
      { status: 500 }
    )
  }
}

// Helper function to generate dates for recurring pattern
function generateRecurringDates(pattern: z.infer<typeof RecurringPatternSchema>): Date[] {
  const dates: Date[] = []
  const startDate = new Date(pattern.startDate)
  const endDate = new Date(pattern.endDate)
  const selectedDays = pattern.days.map(d => parseInt(d)) // Convert string days to numbers

  let currentDate = new Date(startDate)
  
  while (currentDate <= endDate) {
    const dayOfWeek = currentDate.getDay()
    
    if (selectedDays.includes(dayOfWeek)) {
      dates.push(new Date(currentDate))
    }
    
    currentDate.setDate(currentDate.getDate() + 1)
  }

  return dates
}

// Helper function to generate dates for date range
function generateDateRangeDates(range: z.infer<typeof DateRangeSchema>): Date[] {
  const dates: Date[] = []
  const startDate = new Date(range.startDate)
  const endDate = new Date(range.endDate)

  let currentDate = new Date(startDate)
  
  while (currentDate <= endDate) {
    dates.push(new Date(currentDate))
    currentDate.setDate(currentDate.getDate() + 1)
  }

  return dates
}

// GET: Get current availability for menu item
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'MANAGER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, role: true, universityId: true }
    })

    if (!currentUser || !currentUser.universityId) {
      return NextResponse.json({ error: 'Manager university not found' }, { status: 404 })
    }

    const resolvedParams = await params
    const menuItemId = resolvedParams.id

    // Verify menu item belongs to manager's university
    const menuItem = await prisma.menuItem.findUnique({
      where: { id: menuItemId },
      select: { id: true, name: true, universityId: true }
    })

    if (!menuItem) {
      return NextResponse.json({ error: 'Menu item not found' }, { status: 404 })
    }

    if (menuItem.universityId !== currentUser.universityId) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Get current availability records
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const availability = await prisma.menuItemAvailability.findMany({
      where: {
        menuItemId: menuItemId,
        date: { gte: today }
      },
      orderBy: { date: 'asc' },
      take: 30 // Get next 30 days
    })

    return NextResponse.json({
      menuItem: {
        id: menuItem.id,
        name: menuItem.name
      },
      availability: availability.map(record => ({
        date: record.date.toISOString().split('T')[0],
        isAvailable: record.isAvailable,
        maxQuantity: record.maxQuantity,
        currentQuantity: record.currentQuantity
      }))
    })

  } catch (error) {
    console.error('Get availability API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch availability' },
      { status: 500 }
    )
  }
} 