import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { JWT } from 'next-auth/jwt'
import { prisma, ensureConnection } from './prisma'
import { UserRole, UserStatus } from '../generated/prisma'

// Generate a stable secret for development
const getAuthSecret = () => {
  if (process.env.NEXTAUTH_SECRET) {
    return process.env.NEXTAUTH_SECRET
  }
  
  // For development, use a stable secret (must be at least 32 characters)
  if (process.env.NODE_ENV === 'development') {
    return 'dev-secret-aieraa-hostel-jwt-stable-key-2024-minimum-32-chars'
  }
  
  throw new Error('NEXTAUTH_SECRET is required in production')
}

export const authOptions: NextAuthOptions = {
  secret: getAuthSecret(),
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // 24 hours
    updateAge: 60 * 60, // Update every hour
  },
  jwt: {
    maxAge: 24 * 60 * 60, // 24 hours
    // Keep default NextAuth JWT handling for middleware compatibility
  },
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          console.error('❌ Missing credentials')
          return null
        }

        try {
          // Ensure database connection is healthy
          await ensureConnection()
          
          // OPTIMIZED: Only fetch essential auth fields (no JOINs)
          const user = await prisma.user.findUnique({
            where: {
              email: credentials.email
            },
            select: {
              id: true,
              email: true,
              name: true,
              password: true,
              role: true,
              status: true,
              universityId: true,
              university: {
                select: {
                  name: true
                }
              }
            }
          })

          if (!user) {
            console.error('❌ User not found:', credentials.email)
            return null
          }

          // Check status before expensive bcrypt operation
          if (user.status !== UserStatus.APPROVED) {
            console.error('❌ User not approved:', user.status)
            throw new Error('Account pending approval or suspended')
          }

          const isPasswordValid = await bcrypt.compare(
            credentials.password,
            user.password
          )

          if (!isPasswordValid) {
            console.error('❌ Invalid password for user:', credentials.email)
            return null
          }

          // OPTIMIZED: Update lastLoginAt asynchronously (non-blocking)
          prisma.user.update({
            where: { id: user.id },
            data: { lastLoginAt: new Date() }
          }).catch(error => {
            console.error('Failed to update lastLoginAt:', error)
            // Don't fail auth for this non-critical update
          })

          const authUser = {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            status: user.status,
            universityId: user.universityId,
            university: user.university?.name || 'Unknown'
          }

          console.log('✅ User authenticated successfully:', {
            id: authUser.id,
            email: authUser.email,
            role: authUser.role
          })

          return authUser
        } catch (error) {
    console.error(error)
          return null
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user, trigger }) {
      try {
        if (user) {
          console.log('🔧 JWT callback - Setting user data:', {
            id: user.id,
            email: user.email,
            role: user.role
          })
          
          // Set all user data in token
          token.id = user.id
          token.role = user.role
          token.status = user.status
          token.universityId = user.universityId
          token.university = user.university || 'Unknown'
          token.iat = Math.floor(Date.now() / 1000)
          token.exp = Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
        }

        // Validate token structure
        if (!token.id || !token.role) {
          console.error('❌ Invalid token structure:', {
            hasId: !!token.id,
            hasRole: !!token.role,
            hasEmail: !!token.email
          })
          // Return a minimal token instead of null
          return {
            ...token,
            id: token.id || 'invalid',
            role: token.role || 'STUDENT',
            status: token.status || 'INACTIVE',
            universityId: token.universityId || null,
            university: token.university || 'Unknown'
          } as JWT
        }

        // Token validated successfully for middleware use

        return token
      } catch (error) {
    console.error(error)
        // Return a minimal token instead of null
        return {
          ...token,
          id: token.id || 'invalid',
          role: token.role || 'STUDENT',
          status: token.status || 'INACTIVE',
          universityId: token.universityId || null,
          university: token.university || 'Unknown'
        } as JWT
      }
    },
    
    async session({ session, token }) {
      try {
        // Processing token for session creation
        
        if (!token || !token.id || !token.role) {
          console.error('❌ Session callback - Invalid or missing token:', {
            hasToken: !!token,
            hasId: !!token?.id,
            hasRole: !!token?.role
          })
          throw new Error('Invalid session token')
        }

        // Build complete session user object
        session.user = {
          id: token.id as string,
          email: token.email as string,
          name: token.name as string,
          role: token.role as UserRole,
          status: token.status as UserStatus,
          universityId: token.universityId as string,
          university: token.university as string,
          image: token.picture as string
        }

        // Session created successfully

        return session
      } catch (error) {
    console.error(error)
        // Return a minimal session with default user structure
        return {
          ...session,
          user: {
            id: 'invalid',
            email: 'invalid@example.com',
            name: 'Invalid User',
            role: 'STUDENT' as UserRole,
            status: 'INACTIVE' as UserStatus,
            universityId: 'invalid',
            university: 'Unknown',
            image: undefined
          },
          expires: new Date(0).toISOString() // Expire immediately
        }
      }
    }
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/signin'
  },
  events: {
    async signOut({ token }) {
      console.log('📤 User signed out:', token?.email)
    },
    async session({ session, token }) {
      console.log('📋 Session accessed:', {
        userId: session?.user?.id,
        role: session?.user?.role
      })
    }
  },
  debug: process.env.NODE_ENV === 'development'
} 