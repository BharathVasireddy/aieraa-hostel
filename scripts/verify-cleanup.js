import { PrismaClient } from '../src/generated/prisma/index.js'

const prisma = new PrismaClient()

async function verifyCleanup() {
  console.log('🔍 Verifying cleanup results...')
  
  try {
    const orderCount = await prisma.order.count()
    const orderItemCount = await prisma.orderItem.count()
    const availabilityWithQuantity = await prisma.menuItemAvailability.count({
      where: { currentQuantity: { gt: 0 } }
    })
    
    console.log('📊 Current database state:')
    console.log(`   - Orders: ${orderCount}`)
    console.log(`   - Order Items: ${orderItemCount}`)
    console.log(`   - Menu Item Availability with quantities > 0: ${availabilityWithQuantity}`)
    console.log('')
    
    if (orderCount === 0 && orderItemCount === 0 && availabilityWithQuantity === 0) {
      console.log('✅ Cleanup verification PASSED!')
      console.log('✅ All order data has been successfully removed')
      console.log('')
      console.log('🎯 Your system is now ready for:')
      console.log('   - Fresh order placement by students')
      console.log('   - Real analytics based on actual orders')
      console.log('   - Clean dashboard metrics')
    } else {
      console.log('❌ Cleanup verification FAILED!')
      console.log('❌ Some order data still remains in the database')
    }
    
  } catch (error) {
    console.error('❌ Error verifying cleanup:', error)
  } finally {
    await prisma.$disconnect()
  }
}

verifyCleanup() 