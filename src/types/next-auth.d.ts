import { UserRole, UserStatus } from '../generated/prisma'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      email: string
      name: string
      role: UserRole
      status: UserStatus
      universityId: string
      university: string
      image?: string
    }
  }

  interface User {
    role: UserRole
    status: UserStatus
    universityId: string
    university: string
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role: UserRole
    status: UserStatus
    universityId: string
    university: string
  }
} 