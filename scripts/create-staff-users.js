const { PrismaClient } = require('../src/generated/prisma')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function createStaffUsers() {
  console.log('🔧 Creating sample staff users...')

  try {
    // Get a university to assign users to
    const university = await prisma.university.findFirst({
      where: { isActive: true }
    })

    if (!university) {
      console.error('❌ No active university found. Please run the seed script first.')
      return
    }

    console.log(`📍 Using university: ${university.name} (${university.code})`)

    // Create sample managers
    const managers = [
      {
        name: 'John Manager',
        email: 'manager1@university.edu',
        password: 'manager123',
        role: 'MANAGER',
        phone: '+84-123-456-789'
      },
      {
        name: 'Jane Manager',
        email: 'manager2@university.edu',
        password: 'manager123',
        role: 'MANAGER',
        phone: '+84-123-456-790'
      }
    ]

    // Create sample caterers
    const caterers = [
      {
        name: 'Mike Caterer',
        email: 'caterer1@university.edu',
        password: 'caterer123',
        role: 'CATERER',
        phone: '+84-123-456-791'
      },
      {
        name: 'Sarah Caterer',
        email: 'caterer2@university.edu',
        password: 'caterer123',
        role: 'CATERER',
        phone: '+84-123-456-792'
      },
      {
        name: 'David Caterer',
        email: 'caterer3@university.edu',
        password: 'caterer123',
        role: 'CATERER',
        phone: '+84-123-456-793'
      }
    ]

    // Create all staff users
    for (const staffMember of [...managers, ...caterers]) {
      const hashedPassword = await bcrypt.hash(staffMember.password, 12)
      
      const user = await prisma.user.upsert({
        where: { email: staffMember.email },
        update: {},
        create: {
          name: staffMember.name,
          email: staffMember.email,
          password: hashedPassword,
          role: staffMember.role,
          status: 'APPROVED',
          universityId: university.id,
          phone: staffMember.phone
        }
      })

      console.log(`✅ Created ${staffMember.role}: ${user.name} (${user.email})`)
    }

    console.log('🎉 Staff users created successfully!')
    console.log('📋 Login credentials:')
    console.log('   Managers: manager1@university.edu / manager123, manager2@university.edu / manager123')
    console.log('   Caterers: caterer1@university.edu / caterer123, caterer2@university.edu / caterer123, caterer3@university.edu / caterer123')

  } catch (error) {
    console.error('❌ Error creating staff users:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createStaffUsers() 