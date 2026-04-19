import { NextRequest, NextResponse } from 'next/server'

// In-memory store. Swap for Redis in multi-instance prod.
const hits = new Map<string, { count: number; resetAt: number }>()

if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now()
    for (const [k, v] of hits) if (v.resetAt < now) hits.delete(k)
  }, 5 * 60_000)
}

export function checkRateLimit(
  req: NextRequest,
  { limit = 10, windowSeconds = 60 } = {}
): NextResponse | null {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || req.headers.get('x-real-ip') || 'unknown'
  const key = `${ip}:${req.nextUrl.pathname}`
  const now = Date.now()
  const entry = hits.get(key)

  if (!entry || entry.resetAt < now) {
    hits.set(key, { count: 1, resetAt: now + windowSeconds * 1000 })
    return null
  }

  if (++entry.count > limit) {
    return NextResponse.json(
      { error: 'Trop de requêtes. Veuillez réessayer plus tard.' },
      { status: 429, headers: { 'Retry-After': String(Math.ceil((entry.resetAt - now) / 1000)) } }
    )
  }
  return null
}
