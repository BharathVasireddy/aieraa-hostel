import { signOut, getSession } from 'next-auth/react'

export class SessionRecovery {
  private static readonly STORAGE_KEY = 'auth-error-count'
  private static readonly MAX_RETRIES = 3
  private static readonly RETRY_DELAY = 1000 // 1 second

  /**
   * Clear all authentication-related storage
   */
  static clearAuthStorage() {
    if (typeof window !== 'undefined') {
      // Clear NextAuth cookies
      const cookies = document.cookie.split(';')
      cookies.forEach(cookie => {
        const eqPos = cookie.indexOf('=')
        const name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie
        if (name.includes('next-auth') || name.includes('__Secure-next-auth')) {
          document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=${window.location.hostname}`
          document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`
        }
      })
      
      // Clear local storage
      localStorage.removeItem(this.STORAGE_KEY)
      
      // Clear session storage
      sessionStorage.clear()
    }
  }

  /**
   * Get the current error count from storage
   */
  static getErrorCount(): number {
    if (typeof window === 'undefined') return 0
    return parseInt(localStorage.getItem(this.STORAGE_KEY) || '0', 10)
  }

  /**
   * Increment error count in storage
   */
  static incrementErrorCount(): number {
    if (typeof window === 'undefined') return 0
    const count = this.getErrorCount() + 1
    localStorage.setItem(this.STORAGE_KEY, count.toString())
    return count
  }

  /**
   * Reset error count in storage
   */
  static resetErrorCount() {
    if (typeof window === 'undefined') return
    localStorage.removeItem(this.STORAGE_KEY)
  }

  /**
   * Handle JWT/session errors with automatic recovery
   */
  static async handleSessionError(error: Error, pathname?: string): Promise<boolean> {
    console.error('🔴 Session error detected:', error.message)
    
    const errorCount = this.incrementErrorCount()
    
    if (errorCount >= this.MAX_RETRIES) {
      console.error('🔴 Max retries reached, forcing logout')
      await this.forceLogout()
      return false
    }

    console.log(`🔄 Attempting session recovery (${errorCount}/${this.MAX_RETRIES})`)
    
    try {
      // Try to get fresh session
      const session = await getSession()
      
      if (session && session.user && session.user.role) {
        console.log('✅ Session recovered successfully')
        this.resetErrorCount()
        return true
      } else {
        console.log('❌ Session recovery failed - no valid session')
        await this.forceLogout()
        return false
      }
    } catch (recoveryError) {
      console.error('❌ Session recovery failed:', recoveryError)
      
      if (errorCount >= this.MAX_RETRIES) {
        await this.forceLogout()
        return false
      }
      
      // Wait before next retry
      await new Promise(resolve => setTimeout(resolve, this.RETRY_DELAY))
      return this.handleSessionError(error, pathname)
    }
  }

  /**
   * Force logout and clear all authentication data
   */
  static async forceLogout() {
    console.log('🔄 Forcing logout due to session errors')
    
    try {
      // Clear storage first
      this.clearAuthStorage()
      
      // Then sign out
      await signOut({ 
        callbackUrl: '/auth/signin?error=session-expired',
        redirect: true 
      })
    } catch (error) {
      console.error('❌ Force logout failed:', error)
      // Fallback: redirect manually
      if (typeof window !== 'undefined') {
        window.location.href = '/auth/signin?error=session-expired'
      }
    }
  }

  /**
   * Check if current session is valid
   */
  static async validateSession(): Promise<boolean> {
    try {
      const session = await getSession()
      
      if (!session || !session.user || !session.user.role) {
        console.log('❌ Session validation failed - no valid session')
        return false
      }
      
      // Check if session has expired
      const now = new Date()
      const expires = new Date(session.expires)
      
      if (now >= expires) {
        console.log('❌ Session validation failed - session expired')
        return false
      }
      
      console.log('✅ Session validation successful')
      this.resetErrorCount()
      return true
    } catch (error) {
      console.error('❌ Session validation error:', error)
      return false
    }
  }

  /**
   * Auto-recovery hook for React components
   */
  static useAutoRecovery() {
    if (typeof window === 'undefined') return

    // Listen for storage events (session errors from other tabs)
    window.addEventListener('storage', (event) => {
      if (event.key === this.STORAGE_KEY) {
        const errorCount = parseInt(event.newValue || '0', 10)
        if (errorCount >= this.MAX_RETRIES) {
          console.log('🔄 Auto-recovery triggered by storage event')
          this.forceLogout()
        }
      }
    })
  }
} 