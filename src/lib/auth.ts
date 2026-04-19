import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { authOptions } from '@/app/api/auth/[...nextauth]/options'

type AuthOk = { session: { user: { id: string; role: string; email: string } }; error?: never }
type AuthErr = { session?: never; error: NextResponse }

const ADMIN_ROLES = ['admin', 'superadmin']
const MAX_EMAIL = 254
const MAX_TEXT = 5000

export async function requireAdmin(): Promise<AuthOk | AuthErr> {
  if (process.env.NODE_ENV === 'development') {
    return { session: { user: { id: 'dev', role: 'superadmin', email: 'dev@localhost' } } }
  }

  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return { error: NextResponse.json({ error: 'Authentication required' }, { status: 401 }) }
    }

    const role = (session.user as { role?: string }).role
    if (!role || !ADMIN_ROLES.includes(role)) {
      return { error: NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 }) }
    }

    return { session: session as AuthOk['session'] }
  } catch {
    return { error: NextResponse.json({ error: 'Authentication failed' }, { status: 401 }) }
  }
}

export const isValidEmail = (v: string) =>
  typeof v === 'string' && v.length <= MAX_EMAIL && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)

export const sanitize = (v: unknown, maxLen = MAX_TEXT): string => {
  if (typeof v !== 'string') return ''
  return v.trim().slice(0, maxLen)
}

export const VALID_ROLES = ['member', 'admin'] as const
export const VALID_STATUSES = ['active', 'pending', 'cancelled'] as const
export const VALID_PAYMENT = ['paid', 'pending', 'failed'] as const
