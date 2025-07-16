import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { prisma } from './prisma'
import { UserRole, UserStatus } from '../generated/prisma'

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // 24 hours
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
          return null
        }

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
          return null
        }

        // Check status before expensive bcrypt operation
        if (user.status !== UserStatus.APPROVED) {
          throw new Error('Account pending approval or suspended')
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        )

        if (!isPasswordValid) {
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

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          status: user.status,
          universityId: user.universityId,
          university: user.university?.name || 'Unknown'
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        console.log('🔧 JWT callback - Setting user role:', user.role)
        token.id = user.id
        token.role = user.role
        token.status = user.status
        token.universityId = user.universityId
        token.university = user.university || 'Unknown'
      }
              console.log('🔧 JWT token role set to:', token.role)
      return token
    },
          async session({ session, token }) {
        console.log('🔧 Session callback - Token:', {
          hasToken: !!token,
          tokenRole: token?.role,
          tokenId: token?.id,
          tokenEmail: token?.email
        })
        
        if (token && token.id && token.role) {
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
          console.log('✅ Session user role set to:', session.user.role)
        } else {
          console.error('❌ Session callback - Invalid token:', {
            hasToken: !!token,
            hasId: !!token?.id,
            hasRole: !!token?.role
          })
        }
        return session
      }
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/signin'
  }
} 