import { Redis } from 'ioredis';

// Redis client for caching
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

export interface CartCacheData {
  userId: string;
  items: Array<{
    id: string;
    name: string;
    price: number;
    quantity: number;
    variantId?: string;
    variantName?: string;
  }>;
  total: number;
  updatedAt: string;
}

export class CartCache {
  private static CART_TTL = 60 * 60 * 24; // 24 hours
  private static MENU_TTL = 60 * 5; // 5 minutes

  // Get cart from cache
  static async getCart(userId: string): Promise<CartCacheData | null> {
    try {
      const key = `cart:${userId}`;
      const cached = await redis.get(key);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      console.error('Redis get error:', error);
      return null;
    }
  }

  // Set cart in cache
  static async setCart(userId: string, cartData: CartCacheData): Promise<void> {
    try {
      const key = `cart:${userId}`;
      await redis.setex(key, this.CART_TTL, JSON.stringify(cartData));
    } catch (error) {
      console.error('Redis set error:', error);
    }
  }

  // Invalidate cart cache
  static async invalidateCart(userId: string): Promise<void> {
    try {
      const key = `cart:${userId}`;
      await redis.del(key);
    } catch (error) {
      console.error('Redis delete error:', error);
    }
  }

  // Cache menu items
  static async setMenuItems(universityId: string, items: any[]): Promise<void> {
    try {
      const key = `menu:${universityId}`;
      await redis.setex(key, this.MENU_TTL, JSON.stringify(items));
    } catch (error) {
      console.error('Redis menu cache error:', error);
    }
  }

  // Get cached menu items
  static async getMenuItems(universityId: string): Promise<any[] | null> {
    try {
      const key = `menu:${universityId}`;
      const cached = await redis.get(key);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      console.error('Redis menu get error:', error);
      return null;
    }
  }

  // Health check
  static async healthCheck(): Promise<boolean> {
    try {
      await redis.ping();
      return true;
    } catch (error) {
      console.error('Redis health check failed:', error);
      return false;
    }
  }
}

export default redis; 