import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'

const SLUG = process.env.ADMIN_SLUG || 'admin'
const ADMIN_ROLES = ['admin', 'superadmin']
// NOTE: prefixes only. Deliberately does NOT include '/api/membership' — that
// surface is admin-only; its payment-facing sibling lives under '/api/payment'.
const PUBLIC_API = ['/api/auth', '/api/contact', '/api/newsletter', '/api/news', '/api/archives', '/api/setup', '/api/payment']

interface Token { role?: string; id?: string; email?: string }

export async function middleware(req: NextRequest) {
  // Auth bypass needs BOTH dev mode and an explicit opt-in flag, so a
  // misconfigured NODE_ENV alone can never ship an open admin panel.
  if (process.env.NODE_ENV === 'development' && process.env.DEV_AUTH_BYPASS === '1') {
    return NextResponse.next()
  }

  const path = req.nextUrl.pathname

  // Secret entry: /{SLUG}/* → rewrite to /admin/*
  if (path === `/${SLUG}` || path.startsWith(`/${SLUG}/`)) {
    const dest = '/admin' + path.slice(SLUG.length + 1)
    return NextResponse.rewrite(new URL(dest || '/admin', req.url))
  }

  // /admin/* → 404 unless authenticated admin
  if (path.startsWith('/admin')) {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET }) as Token | null
    if (!token?.role || !ADMIN_ROLES.includes(token.role)) {
      return new NextResponse(null, { status: 404 })
    }
    return NextResponse.next()
  }

  // Public API — allow through
  if (path.startsWith('/api/') && PUBLIC_API.some(p => path.startsWith(p))) {
    return NextResponse.next()
  }

  // Protected API — require auth + admin role
  if (path.startsWith('/api/')) {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET }) as Token | null
    if (!token?.role || !ADMIN_ROLES.includes(token.role)) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }
    return NextResponse.next()
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon\\.ico|.*\\.jpg|.*\\.png|.*\\.svg).*)'],
}
