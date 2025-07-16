const { PrismaClient } = require('../src/generated/prisma')

const prisma = new PrismaClient()

async function checkUniversities() {
  console.log('🔍 Checking universities in database...')

  try {
    const universities = await prisma.university.findMany({
      select: {
        id: true,
        name: true,
        code: true,
        city: true,
        isActive: true
      }
    })

    console.log(`📊 Found ${universities.length} universities:`)
    universities.forEach(uni => {
      console.log(`  - ${uni.name} (${uni.code}) - ${uni.city} - ${uni.isActive ? 'Active' : 'Inactive'}`)
    })

    if (universities.length === 0) {
      console.log('❌ No universities found. Please run the seed script first.')
    }

  } catch (error) {
    console.error('❌ Error checking universities:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkUniversities() 