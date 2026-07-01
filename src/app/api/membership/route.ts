import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'
import { adminMembershipCreateSchema, firstZodError } from '@/lib/schemas'
import { encryptField, decryptField } from '@/lib/crypto'

// Admin-only manual member entry (e.g. cash payments at a stand).
// The middleware also blocks this route for non-admins in production, but the
// route enforces auth itself — defense in depth, and safe under any future
// middleware allowlist change (docs/SECURITY_REVIEW.md S2).
export async function POST(request: NextRequest) {
  const auth = await requireAdmin()
  if (auth.error) return auth.error

  let raw
  try {
    raw = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 })
  }

  const parsed = adminMembershipCreateSchema.safeParse(raw)
  if (!parsed.success) {
    return NextResponse.json({ error: firstZodError(parsed.error) }, { status: 400 })
  }
  const data = parsed.data

  const existingMembership = await db.membership.findUnique({
    where: { email: data.email },
    select: { id: true },
  })

  if (existingMembership) {
    return NextResponse.json(
      {
        error: 'Un membre avec cet email existe déjà.',
        email: data.email,
      },
      { status: 409 },
    )
  }

  try {
    const newMembership = await db.membership.create({
      data: {
        email: data.email,
        name: data.fullName,
        tier: data.tier,
        status: data.paymentStatus === 'paid' ? 'active' : 'pending',
        paymentStatus: data.paymentStatus,
        paymentMethod: data.paymentMethod,
        price: data.price,
        startDate: data.startDate,
        endDate: data.endDate,
        memberStatus: data.memberStatus,
        faculty: data.faculty ?? null,
        cin: encryptField(data.cin),
        phone: encryptField(data.phone),
        dateOfBirth: data.dateOfBirth ?? null,
      },
    })

    return NextResponse.json(
      {
        message: 'Membre créé avec succès.',
        memberId: newMembership.id,
      },
      { status: 201 },
    )
  } catch {
    return NextResponse.json(
      { error: "Échec de l'opération de base de données lors de la création du membre." },
      { status: 500 },
    )
  }
}

export async function GET(request: NextRequest) {
  const auth = await requireAdmin()
  if (auth.error) return auth.error
  try {
    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email')

    const where: { email?: string } = {}
    if (email) {
      where.email = email
    }

    const memberships = await db.membership.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
    })

    // PII is encrypted at rest — decrypt for the (admin-only) consumer.
    return NextResponse.json(
      memberships.map((m) => ({
        ...m,
        cin: decryptField(m.cin),
        phone: decryptField(m.phone),
      })),
    )
  } catch {
    return NextResponse.json({ error: 'Failed to fetch memberships' }, { status: 500 })
  }
}
