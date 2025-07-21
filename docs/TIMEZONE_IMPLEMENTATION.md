# 🌏 Vietnam Timezone Implementation - Industry Best Practices

## 📋 **Overview**

This document outlines the comprehensive timezone implementation for the hostel food ordering system, ensuring all operations work consistently in **Vietnam timezone (Asia/Ho_Chi_Minh)** while following industry standards used by companies like **Stripe**, **Shopify**, and **Uber**.

## 🎯 **Core Principles**

### **1. Database Storage: Always UTC**
```typescript
// ✅ CORRECT: Store UTC in database
const order = await prisma.order.create({
  data: {
    orderDate: getCurrentUtc(), // UTC timestamp
    createdAt: getCurrentUtc()  // UTC timestamp
  }
})

// ❌ WRONG: Don't store local time in database
const order = await prisma.order.create({
  data: {
    orderDate: getVietnamTime() // Local time - AVOID
  }
})
```

### **2. Business Logic: Vietnam Time**
```typescript
// ✅ CORRECT: Business logic in local timezone
const vietnamNow = getVietnamTime()
const cutoffTime = getOrderCutoffTime(orderDate) // 10 PM Vietnam time
const isPastCutoff = vietnamNow >= cutoffTime

// User sees: "Order cutoff: 10:00 PM Vietnam time"
```

### **3. API Communication: ISO Strings**
```typescript
// ✅ CORRECT: API responses use ISO strings
const response = {
  orderDate: order.orderDate.toISOString(), // "2024-01-15T15:00:00.000Z"
  createdAt: order.createdAt.toISOString()
}

// Client converts to local time for display
const displayTime = toVietnamTime(new Date(response.createdAt))
```

## 🛠️ **Implementation Stack**

### **Libraries Used**
- **`date-fns-tz`**: Industry standard for timezone handling
- **`date-fns`**: Date manipulation utilities
- **Native Intl API**: Browser timezone support

### **Key Files**
```
src/lib/
├── timezone.ts        # Core timezone utilities
├── db-timezone.ts     # Database timezone operations
└── prisma.ts         # Database client
```

## 📚 **API Reference**

### **Core Functions**

#### **`getVietnamTime()`**
```typescript
// Get current time in Vietnam timezone
const vietnamNow = getVietnamTime()
console.log(vietnamNow) // 2024-01-15 22:30:00 Vietnam time
```

#### **`toVietnamTime(date)`**
```typescript
// Convert any date to Vietnam timezone
const utcDate = new Date('2024-01-15T15:30:00Z')
const vietnamDate = toVietnamTime(utcDate)
console.log(vietnamDate) // 2024-01-15 22:30:00 Vietnam time
```

#### **`vietnamTimeToUtc(date)`**
```typescript
// Convert Vietnam time to UTC for database storage
const vietnamTime = new Date('2024-01-15T22:30:00') // Vietnam time
const utcTime = vietnamTimeToUtc(vietnamTime)
console.log(utcTime) // 2024-01-15T15:30:00Z UTC
```

### **Business Logic Functions**

#### **Order Cutoff Logic**
```typescript
// Check if orders can still be placed
const canOrder = !isPastOrderingCutoff('2024-01-16')

// Get countdown to cutoff
const countdown = getOrderingCountdown('2024-01-16')
// { hours: 2, minutes: 30, isPastCutoff: false }
```

#### **Business Hours**
```typescript
// Check if current time is during business hours
const isOpen = isVietnamBusinessHours() // 6 AM - 11 PM Vietnam time
```

### **Database Operations**

#### **Timezone-Aware Queries**
```typescript
// Query orders for a specific Vietnam date
const orders = await getOrdersByVietnamDate('2024-01-15', universityId)

// Get recent orders (last 24 hours Vietnam time)
const recentOrders = await getRecentOrdersVietnamTime(universityId, 24)
```

#### **Order Creation**
```typescript
// Create order with proper timezone handling
const order = await createOrderWithTimezone({
  userId: 'user123',
  universityId: 'uni456',
  orderDateVietnam: '2024-01-16', // Vietnam date
  totalAmount: 250000
})
```

## 🌐 **Client-Server Consistency**

### **Server-Side Rendering (SSR)**
```typescript
// pages/student/menu.tsx
export async function getServerSideProps() {
  // Server uses Vietnam timezone for business logic
  const vietnamNow = getVietnamTime()
  const availableDates = getNextNBusinessDays(7) // Next 7 days Vietnam time
  
  return {
    props: {
      currentTime: vietnamNow.toISOString(), // Send as ISO string
      availableDates: availableDates.map(d => d.toISOString())
    }
  }
}
```

### **Client-Side Hydration**
```typescript
// components/OrderTimer.tsx
useEffect(() => {
  // Client receives ISO string, converts to Vietnam time
  const vietnamTime = toVietnamTime(new Date(props.currentTime))
  setCurrentTime(vietnamTime)
  
  // Update every minute
  const timer = setInterval(() => {
    setCurrentTime(getVietnamTime())
  }, 60000)
  
  return () => clearInterval(timer)
}, [])
```

## 📊 **Database Schema Considerations**

### **Prisma Schema Types**
```prisma
model Order {
  id        String   @id @default(cuid())
  orderDate DateTime @db.Timestamptz // With timezone support
  createdAt DateTime @default(now()) @db.Timestamptz
  updatedAt DateTime @updatedAt @db.Timestamptz
}
```

### **Migration Considerations**
```sql
-- Ensure all timestamp columns use TIMESTAMPTZ
ALTER TABLE orders 
ALTER COLUMN order_date TYPE TIMESTAMPTZ,
ALTER COLUMN created_at TYPE TIMESTAMPTZ,
ALTER COLUMN updated_at TYPE TIMESTAMPTZ;

-- Set database timezone (optional, we handle in application)
SET timezone = 'Asia/Ho_Chi_Minh';
```

## 🔍 **Testing & Validation**

### **Health Check Endpoint**
```typescript
// /api/health/timezone
export async function GET() {
  const isValid = validateServerTimezone()
  const vietnamTime = getVietnamTime()
  const utcTime = getCurrentUtc()
  
  return NextResponse.json({
    status: isValid ? 'healthy' : 'error',
    timezone: VIETNAM_TIMEZONE,
    vietnamTime: vietnamTime.toISOString(),
    utcTime: utcTime.toISOString(),
    offset: '+07:00'
  })
}
```

### **Unit Tests**
```typescript
describe('Vietnam Timezone', () => {
  test('should convert to Vietnam time correctly', () => {
    const utc = new Date('2024-01-15T15:00:00Z')
    const vietnam = toVietnamTime(utc)
    expect(vietnam.getHours()).toBe(22) // 15 + 7 = 22
  })
  
  test('should calculate order cutoff correctly', () => {
    const cutoff = getOrderCutoffTime('2024-01-16')
    // Should be 10 PM Vietnam time on 2024-01-15
    expect(cutoff.getHours()).toBe(22)
  })
})
```

## 🚀 **Deployment Configuration**

### **Environment Variables**
```bash
# .env
TZ=Asia/Ho_Chi_Minh
NODE_TZ=Asia/Ho_Chi_Minh
DATABASE_URL=postgresql://...
```

### **Docker Configuration**
```dockerfile
# Dockerfile
FROM node:18-alpine
ENV TZ=Asia/Ho_Chi_Minh
RUN apk add --no-cache tzdata
```

### **Vercel Configuration**
```json
// vercel.json
{
  "env": {
    "TZ": "Asia/Ho_Chi_Minh"
  },
  "functions": {
    "app/**": {
      "environment": {
        "TZ": "Asia/Ho_Chi_Minh"
      }
    }
  }
}
```

## 📈 **Performance Considerations**

### **Caching Strategy**
```typescript
// Cache timezone-sensitive data appropriately
const cacheKey = `orders:${universityId}:${vietnamDate}`
const cached = await redis.get(cacheKey)

if (!cached) {
  const orders = await getOrdersByVietnamDate(vietnamDate, universityId)
  await redis.setex(cacheKey, 300, JSON.stringify(orders)) // 5 min cache
}
```

### **Optimization Tips**
- ✅ **Pre-calculate** business hours and cutoff times
- ✅ **Cache** timezone-converted data for 5-15 minutes
- ✅ **Batch** timezone conversions for lists
- ✅ **Use indexes** on UTC timestamp columns
- ❌ **Avoid** real-time timezone conversions in loops

## 🔧 **Common Patterns**

### **Order Management**
```typescript
// Student places order
const orderData = {
  userId: user.id,
  universityId: user.universityId,
  orderDateVietnam: selectedDate, // "2024-01-16"
  items: cartItems
}

// Backend converts to UTC and stores
const order = await createOrderWithTimezone(orderData)

// Frontend displays in Vietnam time
const displayTime = formatDbTimeForUser(order.createdAt)
// "Monday, January 15, 2024 at 10:30 PM"
```

### **Analytics Dashboard**
```typescript
// Admin views daily statistics
const stats = await getDailyOrderStatsVietnam(
  universityId,
  '2024-01-01', // Start date Vietnam
  '2024-01-31'  // End date Vietnam
)

// Results grouped by Vietnam business days
```

## 🎯 **Best Practices Summary**

### **DO's ✅**
- ✅ Store UTC in database
- ✅ Use `date-fns-tz` for timezone operations
- ✅ Validate timezone handling with health checks
- ✅ Convert to local time only for display
- ✅ Use ISO strings for API communication
- ✅ Set server timezone environment variables
- ✅ Test across different server timezones

### **DON'Ts ❌**
- ❌ Store local time in database
- ❌ Use manual UTC offset calculations
- ❌ Assume server timezone matches business timezone
- ❌ Forget timezone conversion in date queries
- ❌ Cache timezone-sensitive data for too long
- ❌ Mix UTC and local times in calculations

---

## 📞 **Support & Maintenance**

### **Health Monitoring**
- Monitor `/api/health/timezone` endpoint
- Alert if timezone validation fails
- Log timezone conversion errors

### **Future Considerations**
- Support for multiple university timezones
- Automatic daylight saving time handling
- International expansion support

---

**🌏 Implementation Complete**: Vietnam timezone handling follows industry standards and is production-ready for hostel food ordering operations. 