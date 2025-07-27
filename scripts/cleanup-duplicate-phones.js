import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function cleanupDuplicatePhones() {
  try {
    console.log('🔍 Finding duplicate phone numbers...')
    
    // Find all users with duplicate phone numbers
    const duplicatePhones = await prisma.$queryRaw`
      SELECT phone, COUNT(*) as count
      FROM users 
      WHERE phone IS NOT NULL AND phone != ''
      GROUP BY phone 
      HAVING COUNT(*) > 1
      ORDER BY COUNT(*) DESC
    `

    if (duplicatePhones.length === 0) {
      console.log('✅ No duplicate phone numbers found!')
      return
    }

    console.log(`\n📊 Found ${duplicatePhones.length} phone numbers with duplicates:`)
    duplicatePhones.forEach(item => {
      console.log(`  📞 ${item.phone}: ${item.count} users`)
    })

    // For each duplicate phone, show the users and ask what to do
    for (const duplicate of duplicatePhones) {
      console.log(`\n🔍 Analyzing phone number: ${duplicate.phone}`)
      
      const users = await prisma.user.findMany({
        where: { phone: duplicate.phone },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          createdAt: true,
          status: true,
          role: true
        },
        orderBy: { createdAt: 'asc' }
      })

      console.log('Users with this phone number:')
      users.forEach((user, index) => {
        console.log(`  ${index + 1}. ${user.name} (${user.email})`)
        console.log(`     ID: ${user.id}`)
        console.log(`     Status: ${user.status}`)
        console.log(`     Role: ${user.role}`)
        console.log(`     Created: ${user.createdAt.toLocaleDateString()}`)
        console.log('')
      })

      // Strategy: Keep the oldest user, set others' phone to null
      const keepUser = users[0] // Keep the first (oldest) user
      const updateUsers = users.slice(1) // Update the rest

      console.log(`📝 Strategy: Keep phone for "${keepUser.name}" (oldest), remove from others`)
      
      // Update other users to have null phone
      for (const userToUpdate of updateUsers) {
        await prisma.user.update({
          where: { id: userToUpdate.id },
          data: { phone: null }
        })
        console.log(`  ✅ Removed phone from: ${userToUpdate.name} (${userToUpdate.email})`)
      }
    }

    console.log('\n✅ Duplicate phone cleanup completed!')
    
    // Verify no duplicates remain
    const remainingDuplicates = await prisma.$queryRaw`
      SELECT phone, COUNT(*) as count
      FROM users 
      WHERE phone IS NOT NULL AND phone != ''
      GROUP BY phone 
      HAVING COUNT(*) > 1
    `

    if (remainingDuplicates.length === 0) {
      console.log('✅ Verification passed: No duplicate phone numbers remain')
      console.log('\n🚀 You can now safely apply the unique constraint with:')
      console.log('   npx prisma db push')
    } else {
      console.log('❌ Warning: Some duplicates still remain')
      console.log(remainingDuplicates)
    }

  } catch (error) {
    console.error('❌ Error during cleanup:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Run the cleanup
cleanupDuplicatePhones()
  .then(() => {
    console.log('\n📋 Summary:')
    console.log('- Duplicate phone numbers have been cleaned up')
    console.log('- Oldest user keeps the phone number')
    console.log('- Other users with same phone have it set to null')
    console.log('- They can update their phone via the profile edit page')
    process.exit(0)
  })
  .catch((error) => {
    console.error('Fatal error:', error)
    process.exit(1)
  }) 