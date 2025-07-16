import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Store active connections for real-time updates
const activeConnections = new Map<string, { 
  controller: ReadableStreamDefaultController, 
  userId: string,
  universityId: string,
  role: string 
}>()

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.id) {
    return new Response('Unauthorized', { status: 401 })
  }

  // Get user details for proper filtering
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, role: true, universityId: true }
  })

  if (!user) {
    return new Response('User not found', { status: 404 })
  }

  const encoder = new TextEncoder()
  
  const stream = new ReadableStream({
    start(controller) {
      const connectionId = `${user.id}-${Date.now()}`
      
      // Store connection for broadcasting updates
      activeConnections.set(connectionId, {
        controller,
        userId: user.id,
        universityId: user.universityId,
        role: user.role
      })
      
      // Send initial connection confirmation
      const welcomeMessage = JSON.stringify({
        type: 'connected',
        timestamp: Date.now(),
        message: 'Real-time updates connected'
      })
      controller.enqueue(encoder.encode(`data: ${welcomeMessage}\n\n`))
      
      // Send initial data based on user role
      sendInitialData(controller, user, encoder)
      
      // Set up periodic heartbeat to keep connection alive
      const heartbeatInterval = setInterval(() => {
        try {
          const heartbeat = JSON.stringify({
            type: 'heartbeat',
            timestamp: Date.now()
          })
          controller.enqueue(encoder.encode(`data: ${heartbeat}\n\n`))
        } catch (error) {
          clearInterval(heartbeatInterval)
          activeConnections.delete(connectionId)
        }
      }, 30000) // Every 30 seconds
      
      // Cleanup on connection close
      const cleanup = () => {
        clearInterval(heartbeatInterval)
        activeConnections.delete(connectionId)
      }
      
      // Handle connection cleanup
      request.signal.addEventListener('abort', cleanup)
      
      return cleanup
    }
  })
  
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control'
    }
  })
}

async function sendInitialData(
  controller: ReadableStreamDefaultController, 
  user: { id: string, role: string, universityId: string },
  encoder: TextEncoder
) {
  try {
    let initialData: any = {}
    
    if (user.role === 'STUDENT') {
      // Get active orders for student
      const activeOrders = await prisma.order.findMany({
        where: {
          userId: user.id,
          status: { in: ['PENDING', 'APPROVED', 'PREPARING', 'READY'] }
        },
        select: {
          id: true,
          orderNumber: true,
          status: true,
          totalAmount: true,
          orderDate: true,
          createdAt: true
        },
        orderBy: { createdAt: 'desc' },
        take: 5
      })
      
      initialData = {
        type: 'initial_data',
        activeOrders,
        timestamp: Date.now()
      }
    } else if (user.role === 'MANAGER' || user.role === 'ADMIN') {
      // Get pending orders for managers
      const pendingOrders = await prisma.order.findMany({
        where: {
          universityId: user.universityId,
          status: 'PENDING'
        },
        select: {
          id: true,
          orderNumber: true,
          status: true,
          totalAmount: true,
          orderDate: true,
          createdAt: true,
          user: {
            select: { name: true, studentId: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 10
      })
      
      initialData = {
        type: 'initial_data',
        pendingOrders,
        timestamp: Date.now()
      }
    }
    
    const message = JSON.stringify(initialData)
    controller.enqueue(encoder.encode(`data: ${message}\n\n`))
    
  } catch (error) {
    console.error('Error sending initial data:', error)
  }
}

// Broadcast order updates to relevant connections
function broadcastOrderUpdate(
  orderId: string, 
  orderData: any, 
  updateType: 'status_change' | 'new_order' | 'payment_update'
) {
  const encoder = new TextEncoder()
  
  for (const [connectionId, connection] of activeConnections.entries()) {
    try {
      // Filter updates based on user role and relevance
      let shouldReceiveUpdate = false
      
      if (connection.role === 'STUDENT' && orderData.userId === connection.userId) {
        shouldReceiveUpdate = true
      } else if (
        (connection.role === 'MANAGER' || connection.role === 'ADMIN') && 
        orderData.universityId === connection.universityId
      ) {
        shouldReceiveUpdate = true
      }
      
      if (shouldReceiveUpdate) {
        const updateMessage = JSON.stringify({
          type: updateType,
          orderId,
          orderData,
          timestamp: Date.now()
        })
        
        connection.controller.enqueue(
          encoder.encode(`data: ${updateMessage}\n\n`)
        )
      }
    } catch (error) {
      // Connection might be closed, remove it
      activeConnections.delete(connectionId)
    }
  }
}

// Broadcast menu updates (when items are enabled/disabled)
function broadcastMenuUpdate(
  universityId: string,
  menuItemId: string,
  updateData: any,
  updateType: 'item_toggle' | 'price_change' | 'availability_change'
) {
  const encoder = new TextEncoder()
  
  for (const [connectionId, connection] of activeConnections.entries()) {
    try {
      if (connection.universityId === universityId) {
        const updateMessage = JSON.stringify({
          type: updateType,
          menuItemId,
          updateData,
          timestamp: Date.now()
        })
        
        connection.controller.enqueue(
          encoder.encode(`data: ${updateMessage}\n\n`)
        )
      }
    } catch (error) {
      activeConnections.delete(connectionId)
    }
  }
}

// Get current connection stats (for monitoring)
function getConnectionStats() {
  const stats = {
    totalConnections: activeConnections.size,
    studentConnections: 0,
    managerConnections: 0,
    connectionsByUniversity: {} as Record<string, number>
  }
  
  for (const connection of activeConnections.values()) {
    if (connection.role === 'STUDENT') {
      stats.studentConnections++
    } else if (connection.role === 'MANAGER' || connection.role === 'ADMIN') {
      stats.managerConnections++
    }
    
    stats.connectionsByUniversity[connection.universityId] = 
      (stats.connectionsByUniversity[connection.universityId] || 0) + 1
  }
  
  return stats
} 