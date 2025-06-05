const { PrismaClient } = require('../src/generated/prisma')

const prisma = new PrismaClient()

async function createReadyOrder() {
  try {
    // Get a student user
    const student = await prisma.user.findFirst({
      where: { role: 'STUDENT' }
    })
    
    if (!student) {
      console.log('❌ No student found. Please create a student account first.')
      return
    }

    // Get a menu item
    const menuItem = await prisma.menuItem.findFirst({
      where: { isActive: true }
    })
    
    if (!menuItem) {
      console.log('❌ No menu items found. Please create menu items first.')
      return
    }

    // Get university
    const university = await prisma.university.findFirst()

    // Create order with READY status
    const order = await prisma.order.create({
      data: {
        orderNumber: `ORD${Date.now()}`,
        userId: student.id,
        universityId: university.id,
        orderDate: new Date(),
        status: 'READY',
        paymentStatus: 'PAID',
        totalAmount: menuItem.basePrice,
        subtotalAmount: menuItem.basePrice,
        taxAmount: 0,
        orderItems: {
          create: [{
            menuItemId: menuItem.id,
            quantity: 1,
            price: menuItem.basePrice
          }]
        }
      },
      include: {
        user: true,
        orderItems: {
          include: {
            menuItem: true
          }
        }
      }
    })

    console.log('✅ Ready order created successfully!')
    console.log('📝 Order Number:', order.orderNumber)
    console.log('👤 Student:', order.user.name)
    console.log('🍔 Item:', order.orderItems[0].menuItem.name)
    console.log('💰 Amount: ₹' + order.totalAmount)
    console.log('📱 Status:', order.status)
    console.log('')
    console.log('🎯 This order is now available for caterers to serve!')
    
  } catch (error) {
    console.error('❌ Error creating ready order:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createReadyOrder() 