const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcrypt')

const prisma = new PrismaClient()

async function createCaterer() {
  try {
    // Get the first university
    const university = await prisma.university.findFirst()
    
    if (!university) {
      console.log('❌ No university found. Please create a university first.')
      return
    }

    // Hash password
    const hashedPassword = await bcrypt.hash('Caterer123!', 12)

    // Create caterer user
    const caterer = await prisma.user.create({
      data: {
        email: 'caterer@test.com',
        password: hashedPassword,
        name: 'Food Counter Staff',
        role: 'CATERER',
        status: 'APPROVED',
        universityId: university.id,
        phone: '+1234567890'
      }
    })

    console.log('✅ Caterer account created successfully!')
    console.log('📧 Email: caterer@test.com')
    console.log('🔑 Password: Caterer123!')
    console.log('🏫 University:', university.name)
    console.log('👤 Name:', caterer.name)
    console.log('')
    console.log('🚀 You can now login at: /auth/signin')
    console.log('📱 After login, visit: /caterer')
    
  } catch (error) {
    if (error.code === 'P2002') {
      console.log('⚠️  Caterer account already exists!')
      console.log('📧 Email: caterer@test.com')
      console.log('🔑 Password: Caterer123!')
    } else {
      console.error('❌ Error creating caterer:', error)
    }
  } finally {
    await prisma.$disconnect()
  }
}

createCaterer() 