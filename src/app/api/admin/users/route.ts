import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdmin, isValidEmail, sanitize, VALID_ROLES } from '@/lib/auth'

const SELECT = { id: true, email: true, name: true, role: true, createdAt: true, updatedAt: true }

export async function GET() {
  const auth = await requireAdmin()
  if (auth.error) return auth.error

  try {
    const users = await db.user.findMany({ orderBy: { createdAt: 'desc' }, select: SELECT })
    return NextResponse.json(users)
  } catch {
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin()
  if (auth.error) return auth.error

  try {
    const body = await req.json()
    const email = sanitize(body.email, 254).toLowerCase()
    const name = sanitize(body.name, 256)
    const role = body.role

    if (!email || !name || !role) return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    if (!isValidEmail(email)) return NextResponse.json({ error: 'Invalid email' }, { status: 400 })
    if (!VALID_ROLES.includes(role)) return NextResponse.json({ error: 'Invalid role' }, { status: 400 })

    const exists = await db.user.findUnique({ where: { email } })
    if (exists) return NextResponse.json({ error: 'User already exists' }, { status: 400 })

    const user = await db.user.create({ data: { email, name, role }, select: SELECT })
    return NextResponse.json(user, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 })
  }
}
