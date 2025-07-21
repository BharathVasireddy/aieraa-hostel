// Utility function to migrate localStorage cart data to database
export async function migrateLocalStorageCart(userId: string) {
  if (typeof window === 'undefined') return

  try {
    const cartKey = `cart_${userId}`
    const localCart = localStorage.getItem(cartKey)
    
    if (!localCart) return
    
    const cartItems = JSON.parse(localCart)
    
    if (!Array.isArray(cartItems) || cartItems.length === 0) {
      localStorage.removeItem(cartKey)
      return
    }

    // Migrate each item to database
    for (const item of cartItems) {
      try {
        await fetch('/api/cart', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            menuItemId: item.id,
            variantId: item.variantId,
            quantity: item.quantity
          })
        })
      } catch (error) {
        console.error('Failed to migrate cart item:', item, error)
      }
    }

    // Clear localStorage after successful migration
    localStorage.removeItem(cartKey)
    console.log('Cart migration completed for user:', userId)

  } catch (error) {
    console.error('Cart migration failed:', error)
  }
}

// Function to check if migration is needed
export function needsCartMigration(userId: string): boolean {
  if (typeof window === 'undefined') return false
  
  const cartKey = `cart_${userId}`
  const localCart = localStorage.getItem(cartKey)
  
  if (!localCart) return false
  
  try {
    const cartItems = JSON.parse(localCart)
    return Array.isArray(cartItems) && cartItems.length > 0
  } catch {
    // Remove invalid cart data
    localStorage.removeItem(cartKey)
    return false
  }
} 