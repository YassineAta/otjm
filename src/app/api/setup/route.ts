import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'
import { isValidEmail, sanitize } from '@/lib/auth'
import { checkRateLimit } from '@/lib/rate-limit'

/**
 * POST /api/setup — one-time bootstrap of the first admin account.
 *
 * Only works when the Admin collection is empty. After the first admin
 * is created, all subsequent calls return 403. This enables first-admin
 * creation on Vercel where there is no shell access to run createAdmin.js.
 */
export async function POST(req: NextRequest) {
  const limited = checkRateLimit(req, { limit: 3, windowSeconds: 60 })
  if (limited) return limited

  try {
    const existing = await db.admin.count()
    if (existing > 0) {
      return NextResponse.json(
        { error: 'Setup already completed. An admin account exists.' },
        { status: 403 }
      )
    }

    const body = await req.json()
    const email = sanitize(body.email, 254).toLowerCase()
    const password = typeof body.password === 'string' ? body.password : ''
    const name = sanitize(body.name, 100) || 'Admin'

    if (!email || !isValidEmail(email)) {
      return NextResponse.json({ error: 'Adresse email invalide.' }, { status: 400 })
    }
    if (password.length < 12) {
      return NextResponse.json(
        { error: 'Le mot de passe doit contenir au moins 12 caractères.' },
        { status: 400 }
      )
    }

    const hashedPassword = await bcrypt.hash(password, 12)

    const admin = await db.admin.create({
      data: { email, hashedPassword, name, role: 'superadmin' }
    })

    return NextResponse.json(
      { success: true, email: admin.email },
      { status: 201 }
    )
  } catch {
    return NextResponse.json(
      { error: 'Échec de la création du compte administrateur.' },
      { status: 500 }
    )
  }
}
