import type { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { db as prisma } from '@/lib/db'
import bcrypt from 'bcryptjs'

export const authOptions: NextAuthOptions = {
  // 1. PROVIDERS: Logic to check MongoDB Atlas for admin users
  providers: [
    CredentialsProvider({
      name: 'Admin Login',
      credentials: {
        email: { label: 'Email', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Missing email or password')
        }

        // Search the 'Admin' collection in MongoDB Atlas
        const admin = await prisma.admin.findUnique({
          where: { email: credentials.email },
        })

        // Verify user exists and the password matches the hash in the DB
        if (admin && (await bcrypt.compare(credentials.password, admin.hashedPassword))) {
          // LINKING: Safely Upsert the User record during auth bypass
          const linkedUser = await prisma.user.upsert({
            where: { email: admin.email },
            update: {
              name: admin.name,
              role: admin.role === 'superadmin' ? 'admin' : 'member',
            },
            create: {
              email: admin.email,
              name: admin.name,
              role: admin.role === 'superadmin' ? 'admin' : 'member',
            },
          })

          return {
            id: linkedUser.id, // CRITICAL: We pass the linked user ID for foreign-keys (authorId)
            name: linkedUser.name || 'Administrator',
            email: linkedUser.email,
            // The JWT must carry the REAL Admin-collection role. The linked
            // User row's role is content-authorship plumbing only — using it
            // here downgraded non-superadmin admins to 'member' and locked
            // them out at the middleware (SECURITY_REVIEW.md S7).
            role: admin.role,
          }
        }

        // Return null if authentication fails (triggers 401 in client)
        return null
      },
    }),
  ],

  // 2. SESSION STRATEGY: Required for Next.js App Router
  session: {
    strategy: 'jwt',
  },

  callbacks: {
    // Persistent storage of the role and id in the JWT
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role
        token.id = user.id
      }
      return token
    },

    // Inject the role into the browser session (accessible via useSession())
    async session({ session, token }) {
      if (session.user) {
        session.user.role = token.role
        session.user.id = token.id
      }
      return session
    },
  },

  // 3. PAGES: Custom redirect for authentication
  pages: {
    signIn: '/admin',
  },

  // 4. SECURITY: Uses NEXTAUTH_SECRET from your .env
  secret: process.env.NEXTAUTH_SECRET,
}
