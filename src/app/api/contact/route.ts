import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdmin, isValidEmail, sanitize } from '@/lib/auth'
import { checkRateLimit } from '@/lib/rate-limit'

export async function POST(req: NextRequest) {
  const limited = checkRateLimit(req, { limit: 5, windowSeconds: 60 })
  if (limited) return limited

  try {
    const body = await req.json()
    const name = sanitize(body.name, 256)
    const email = sanitize(body.email, 254).toLowerCase()
    const subject = sanitize(body.subject, 256)
    const message = sanitize(body.message, 5000)

    if (!name || !email || !subject || !message) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }
    if (!isValidEmail(email)) {
      return NextResponse.json({ error: 'Invalid email' }, { status: 400 })
    }

    const contact = await db.contact.create({
      data: { name, email, subject, message, status: 'unread' },
    })
    return NextResponse.json({ id: contact.id }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Failed to submit' }, { status: 500 })
  }
}

export async function GET() {
  const auth = await requireAdmin()
  if (auth.error) return auth.error

  try {
    const contacts = await db.contact.findMany({ orderBy: { createdAt: 'desc' } })
    return NextResponse.json(contacts)
  } catch {
    return NextResponse.json({ error: 'Failed to fetch contacts' }, { status: 500 })
  }
}
