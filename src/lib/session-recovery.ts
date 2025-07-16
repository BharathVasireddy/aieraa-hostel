import { getSession, signOut } from 'next-auth/react'

interface SessionRecoveryState {
  isRecovering: boolean
  attempts: number
  lastAttempt: number
  sessionValid: boolean
}

class SessionRecovery {
  private state: SessionRecoveryState = {
    isRecovering: false,
    attempts: 0,
    lastAttempt: 0,
    sessionValid: false
  }
  
  private readonly MAX_RETRIES = 3
  private readonly RETRY_DELAY = 1000
  private readonly SESSION_CHECK_INTERVAL = 30000 // 30 seconds
  private readonly RECOVERY_TIMEOUT = 10000 // 10 seconds
  
  private sessionCheckInterval: NodeJS.Timeout | null = null
  private recoveryPromise: Promise<boolean> | null = null
  
  constructor() {
    this.startSessionMonitoring()
  }
  
  private startSessionMonitoring() {
    if (typeof window === 'undefined') return
    
    // Check session validity every 30 seconds
    this.sessionCheckInterval = setInterval(() => {
      this.validateSession()
    }, this.SESSION_CHECK_INTERVAL)
    
    // Check on page visibility change
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        this.validateSession()
      }
    })
    
    // Check on storage events (for cross-tab communication)
    window.addEventListener('storage', (e) => {
      if (e.key === 'session-recovery' && e.newValue === 'trigger') {
        this.validateSession()
      }
    })
  }
  
  async recoverSession(): Promise<boolean> {
    if (this.state.isRecovering) {
      return this.recoveryPromise || false
    }
    
    this.state.isRecovering = true
    this.state.attempts = 0
    
    this.recoveryPromise = this.performRecovery()
    
    try {
      const result = await this.recoveryPromise
      return result
    } finally {
      this.state.isRecovering = false
      this.recoveryPromise = null
    }
  }
  
  private async performRecovery(): Promise<boolean> {
    const startTime = Date.now()
    
    while (this.state.attempts < this.MAX_RETRIES) {
      // Check if we've exceeded the timeout
      if (Date.now() - startTime > this.RECOVERY_TIMEOUT) {
        return false
      }
      
      this.state.attempts++
      this.state.lastAttempt = Date.now()
      
      try {
        const session = await getSession()
        
        if (session?.user?.id) {
          this.state.sessionValid = true
          return true
        }
        
        // If no session, wait before retrying
        if (this.state.attempts < this.MAX_RETRIES) {
          await new Promise(resolve => setTimeout(resolve, this.RETRY_DELAY))
        }
      } catch (error) {
        // Recovery failed, try again
        if (this.state.attempts < this.MAX_RETRIES) {
          await new Promise(resolve => setTimeout(resolve, this.RETRY_DELAY))
        }
      }
    }
    
    return false
  }
  
  async forceLogout(): Promise<void> {
    this.state.sessionValid = false
    
    try {
      await signOut({ redirect: false })
      
      // Clear local storage
      localStorage.removeItem('session-recovery')
      
      // Redirect to login
      window.location.href = '/auth/signin'
    } catch (error) {
      // Force redirect even if signOut fails
      window.location.href = '/auth/signin'
    }
  }
  
  private async validateSession(): Promise<void> {
    try {
      const session = await getSession()
      
      if (!session?.user?.id) {
        this.state.sessionValid = false
        return
      }
      
      // Check if session is expired
      if (session.expires) {
        const expiryTime = new Date(session.expires).getTime()
        const currentTime = Date.now()
        
        if (currentTime >= expiryTime) {
          this.state.sessionValid = false
          return
        }
      }
      
      this.state.sessionValid = true
    } catch (error) {
      this.state.sessionValid = false
    }
  }
  
  // Trigger recovery from other tabs
  triggerCrossTabRecovery() {
    if (typeof window !== 'undefined') {
      localStorage.setItem('session-recovery', 'trigger')
      localStorage.removeItem('session-recovery')
    }
  }
  
  // Get current session state
  getSessionState(): SessionRecoveryState {
    return { ...this.state }
  }
  
  // Check if session is valid
  isSessionValid(): boolean {
    return this.state.sessionValid
  }
  
  // Cleanup
  destroy() {
    if (this.sessionCheckInterval) {
      clearInterval(this.sessionCheckInterval)
      this.sessionCheckInterval = null
    }
  }
}

// Create singleton instance
let sessionRecovery: SessionRecovery | null = null

export function getSessionRecovery(): SessionRecovery {
  if (!sessionRecovery) {
    sessionRecovery = new SessionRecovery()
  }
  return sessionRecovery
}

// Auto-recovery hook for React components
export function useSessionRecovery() {
  const recovery = getSessionRecovery()
  
  return {
    recoverSession: () => recovery.recoverSession(),
    getSessionState: () => recovery.getSessionState(),
    isSessionValid: () => recovery.isSessionValid(),
    forceLogout: () => recovery.forceLogout(),
    triggerCrossTabRecovery: () => recovery.triggerCrossTabRecovery()
  }
}

// Utility function to handle API errors with session recovery
export async function handleAPIError(error: any, recovery?: SessionRecovery) {
  if (error.status === 401 || error.status === 403) {
    const sessionRecovery = recovery || getSessionRecovery()
    
    // Try to recover session
    const recovered = await sessionRecovery.recoverSession()
    
    if (!recovered) {
      // If recovery fails, force logout
      await sessionRecovery.forceLogout()
      return false
    }
    
    return true
  }
  
  return false
}

// Export the singleton instance
export { SessionRecovery } 