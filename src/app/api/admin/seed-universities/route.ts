import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@/generated/prisma'

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    console.log('🏫 Updating universities...')

    // First deactivate old universities
    await prisma.university.updateMany({
      where: {
        code: {
          in: ['DEMO', 'MIT']
        }
      },
      data: {
        isActive: false
      }
    })

    const universities = await Promise.all([
      prisma.university.upsert({
        where: { code: 'CTUMP' },
        update: {
          name: 'Can Tho University',
          address: '3/2 Street, Xuan Khanh Ward, Ninh Kieu District, Can Tho City, Vietnam',
          contactInfo: 'info@ctu.edu.vn',
          isActive: true,
        },
        create: {
          name: 'Can Tho University',
          code: 'CTUMP',
          address: '3/2 Street, Xuan Khanh Ward, Ninh Kieu District, Can Tho City, Vietnam',
          contactInfo: 'info@ctu.edu.vn',
          isActive: true,
          settings: {
            create: {
              cutoffHours: 22,
              maxAdvanceOrderDays: 7,
              minAdvanceOrderHours: 12,
              allowWeekendOrders: true,
              taxRate: 0.10 // 10% VAT Vietnam
            }
          }
        },
      }),
      prisma.university.upsert({
        where: { code: 'PCTU' },
        update: {
          name: 'Phan Chau Trinh University',
          address: '99 Phan Chau Trinh Street, Da Nang City, Vietnam',
          contactInfo: 'info@pct.edu.vn',
          isActive: true,
        },
        create: {
          name: 'Phan Chau Trinh University',
          code: 'PCTU',
          address: '99 Phan Chau Trinh Street, Da Nang City, Vietnam',
          contactInfo: 'info@pct.edu.vn',
          isActive: true,
          settings: {
            create: {
              cutoffHours: 21,
              maxAdvanceOrderDays: 5,
              minAdvanceOrderHours: 8,
              allowWeekendOrders: true,
              taxRate: 0.10 // 10% VAT Vietnam
            }
          }
        },
      }),
      prisma.university.upsert({
        where: { code: 'DNU' },
        update: {
          name: 'Dai Nam University',
          address: 'National Highway 1A, Hoa Phu Ward, Thu Dau Mot City, Binh Duong Province, Vietnam',
          contactInfo: 'info@dainam.edu.vn',
          isActive: true,
        },
        create: {
          name: 'Dai Nam University',
          code: 'DNU',
          address: 'National Highway 1A, Hoa Phu Ward, Thu Dau Mot City, Binh Duong Province, Vietnam',
          contactInfo: 'info@dainam.edu.vn',
          isActive: true,
          settings: {
            create: {
              cutoffHours: 22,
              maxAdvanceOrderDays: 6,
              minAdvanceOrderHours: 10,
              allowWeekendOrders: true,
              taxRate: 0.10 // 10% VAT Vietnam
            }
          }
        },
      }),
      prisma.university.upsert({
        where: { code: 'BMU' },
        update: {
          name: 'Buon Ma Thout Medical University',
          address: '216 Nguyen Cong Tru Street, Tan Loi Ward, Buon Ma Thuot City, Dak Lak Province, Vietnam',
          contactInfo: 'info@bmtmu.edu.vn',
          isActive: true,
        },
        create: {
          name: 'Buon Ma Thout Medical University',
          code: 'BMU',
          address: '216 Nguyen Cong Tru Street, Tan Loi Ward, Buon Ma Thuot City, Dak Lak Province, Vietnam',
          contactInfo: 'info@bmtmu.edu.vn',
          isActive: true,
          settings: {
            create: {
              cutoffHours: 21,
              maxAdvanceOrderDays: 7,
              minAdvanceOrderHours: 12,
              allowWeekendOrders: false,
              taxRate: 0.10 // 10% VAT Vietnam (changed from Azerbaijan to Vietnam)
            }
          }
        },
      })
    ])

    // Get all universities to return
    const allUniversities = await prisma.university.findMany({
      select: {
        id: true,
        code: true,
        name: true,
        isActive: true
      },
      orderBy: {
        code: 'asc'
      }
    })

    console.log(`✅ Updated ${universities.length} universities`)

    return NextResponse.json({
      success: true,
      message: `Updated ${universities.length} universities`,
      universities: allUniversities
    })

  } catch (error) {
    console.error('❌ University update failed:', error)
    return NextResponse.json(
      { error: 'Failed to update universities' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
} 