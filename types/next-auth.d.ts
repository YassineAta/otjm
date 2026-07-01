import NextAuth, { DefaultSession, DefaultUser } from 'next-auth'
import { JWT } from 'next-auth/jwt'

declare module 'next-auth' {
  // Extending the built-in session user
  interface Session {
    user: {
      id: string
      role: string
    } & DefaultSession['user']
  }

  // Extending the built-in user object returned from authorize
  interface User extends DefaultUser {
    id: string
    role: string
  }
}

declare module 'next-auth/jwt' {
  // Extending the JWT to include the custom properties
  interface JWT {
    id: string
    role: string
  }
}
