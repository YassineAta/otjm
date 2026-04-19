import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdmin, isValidEmail, sanitize } from '@/lib/auth'
import { checkRateLimit } from '@/lib/rate-limit'

export async function POST(req: NextRequest) {
  const limited = checkRateLimit(req, { limit: 5, windowSeconds: 60 })
  if (limited) return limited

  try {
    const body = await req.json()
    const email = sanitize(body.email, 254).toLowerCase()

    if (!email || !isValidEmail(email)) {
      return NextResponse.json({ error: 'Valid email required' }, { status: 400 })
    }

    const existing = await db.newsletter.findUnique({ where: { email } })
    if (existing) {
      await db.newsletter.update({ where: { email }, data: { active: true } })
      return NextResponse.json({ ok: true })
    }

    await db.newsletter.create({ data: { email, active: true } })
    return NextResponse.json({ ok: true }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Failed to subscribe' }, { status: 500 })
  }
}

export async function GET() {
  const auth = await requireAdmin()
  if (auth.error) return auth.error

  try {
    const subs = await db.newsletter.findMany({ orderBy: { createdAt: 'desc' } })
    return NextResponse.json(subs)
  } catch {
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 })
  }
}
