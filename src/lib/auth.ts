import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { prisma } from './prisma'
import { UserRole, UserStatus } from '../generated/prisma'

export const authOptions: NextAuthOptions = {
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

        const user = await prisma.user.findUnique({
          where: {
            email: credentials.email
          },
          include: {
            university: true
          }
        })

        if (!user) {
          return null
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        )

        if (!isPasswordValid) {
          return null
        }

        // Check if user is approved
        if (user.status !== UserStatus.APPROVED) {
          throw new Error('Account pending approval or suspended')
        }

        // Update last login
        await prisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() }
        })

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          status: user.status,
          universityId: user.universityId,
          university: user.university.name,
          image: user.profileImage
        }
      }
    })
  ],
  session: {
    strategy: 'jwt'
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = user.role
        token.status = user.status
        token.universityId = user.universityId
        token.university = user.university
      }
      
      // Validate user still exists and is active
      if (token.id) {
        try {
          const currentUser = await prisma.user.findUnique({
            where: { id: token.id as string },
            select: { id: true, status: true, forcedLogoutAt: true }
          })
          
          // If user doesn't exist or is not approved, mark token as invalid
          if (!currentUser || currentUser.status !== 'APPROVED') {
            token.invalid = true
            return token
          }
          
          // Check for forced logout
          if (currentUser.forcedLogoutAt && token.iat && typeof token.iat === 'number') {
            const tokenIssuedAt = new Date(token.iat * 1000)
            if (currentUser.forcedLogoutAt > tokenIssuedAt) {
              token.invalid = true
              return token
            }
          }
        } catch (error) {
          console.error('Error validating user in JWT callback:', error)
          token.invalid = true
          return token
        }
      }
      
      return token
    },
    async session({ session, token }) {
      // If token is marked as invalid, return null to end session
      if (token.invalid) {
        return null as any
      }
      
      if (token) {
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
      }
      return session
    }
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/signin'
  }
} 