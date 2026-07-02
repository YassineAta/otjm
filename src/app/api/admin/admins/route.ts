import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { db } from '@/lib/db'
import { requireSuperAdmin, isValidEmail, sanitize } from '@/lib/auth'
import { generateTempPassword } from '@/lib/admin-accounts'

const SELECT = { id: true, email: true, name: true, role: true, createdAt: true }

export async function GET() {
  const auth = await requireSuperAdmin()
  if (auth.error) return auth.error

  try {
    const admins = await db.admin.findMany({ orderBy: { createdAt: 'asc' }, select: SELECT })
    return NextResponse.json(admins)
  } catch {
    return NextResponse.json(
      { error: 'Impossible de charger les comptes administrateurs.' },
      { status: 500 },
    )
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireSuperAdmin()
  if (auth.error) return auth.error

  try {
    const body = await req.json()
    const email = sanitize(body.email, 254).toLowerCase()
    const name = sanitize(body.name, 100)

    if (!email || !isValidEmail(email)) {
      return NextResponse.json({ error: 'Adresse email invalide.' }, { status: 400 })
    }
    if (!name) {
      return NextResponse.json({ error: 'Le nom est requis.' }, { status: 400 })
    }

    const exists = await db.admin.findUnique({ where: { email } })
    if (exists) {
      return NextResponse.json({ error: 'Un compte existe déjà avec cet email.' }, { status: 400 })
    }

    // ADR-010 : mot de passe fort généré côté serveur, renvoyé une seule fois
    // au superadmin, jamais stocké en clair ni journalisé.
    const tempPassword = generateTempPassword()
    const hashedPassword = await bcrypt.hash(tempPassword, 12)

    const admin = await db.admin.create({
      data: { email, name, role: 'admin', hashedPassword },
      select: SELECT,
    })

    return NextResponse.json({ ...admin, tempPassword }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Échec de la création du compte.' }, { status: 500 })
  }
}
