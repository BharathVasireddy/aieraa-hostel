import { PrismaClient } from '../src/generated/prisma/index.js'

const prisma = new PrismaClient()

const sampleBanners = [
  {
    title: "New Year Offer",
    description: "Get amazing discounts on all your favorite hostel meals! Limited time only.",
    image: "https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
    actionType: "menu",
    actionValue: "",
    buttonText: "Get 30% OFF",
    discountPercentage: 30,
    offerValidUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    backgroundColor: "#10B981",
    textColor: "#FFFFFF",
    order: 1,
    isActive: true
  },
  {
    title: "Breakfast Special",
    description: "Start your day right with our delicious breakfast combos.",
    image: "https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
    actionType: "category",
    actionValue: "BREAKFAST",
    buttonText: "Order Now",
    discountPercentage: 20,
    offerValidUntil: null,
    backgroundColor: "#F59E0B",
    textColor: "#FFFFFF",
    order: 2,
    isActive: true
  },
  {
    title: "Weekend Pizza Night",
    description: "Enjoy freshly made pizzas every weekend at special prices!",
    image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
    actionType: "search",
    actionValue: "pizza",
    buttonText: "Find Pizza",
    discountPercentage: 15,
    offerValidUntil: null,
    backgroundColor: "#DC2626",
    textColor: "#FFFFFF",
    order: 3,
    isActive: true
  }
]

async function createSampleBanners() {
  try {
    console.log('Creating sample promotional banners...')
    
    // Get the first university
    const university = await prisma.university.findFirst({
      where: { isActive: true }
    })
    
    if (!university) {
      console.error('No active university found. Please create a university first.')
      return
    }
    
    // Get the first admin user
    const adminUser = await prisma.user.findFirst({
      where: { 
        role: { in: ['ADMIN', 'MANAGER'] },
        universityId: university.id
      }
    })
    
    if (!adminUser) {
      console.error('No admin user found. Please create an admin user first.')
      return
    }
    
    console.log(`Using university: ${university.name}`)
    console.log(`Created by user: ${adminUser.name}`)
    
    // Create banners
    for (const bannerData of sampleBanners) {
      const banner = await prisma.promotionalBanner.create({
        data: {
          ...bannerData,
          universityId: university.id,
          createdBy: adminUser.id
        }
      })
      
      console.log(`✅ Created banner: ${banner.title}`)
    }
    
    console.log('✅ All sample banners created successfully!')
    
  } catch (error) {
    console.error('Error creating sample banners:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createSampleBanners() 