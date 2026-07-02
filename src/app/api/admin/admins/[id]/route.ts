import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireSuperAdmin } from '@/lib/auth'
import { canDeleteAdmin } from '@/lib/admin-accounts'

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireSuperAdmin()
  if (auth.error) return auth.error

  try {
    const { id } = await params
    const target = await db.admin.findUnique({ where: { id } })
    if (!target) {
      return NextResponse.json({ error: 'Compte introuvable.' }, { status: 404 })
    }

    const blocked = canDeleteAdmin(auth.session.user.email, {
      email: target.email,
      role: target.role,
    })
    if (blocked) return NextResponse.json({ error: blocked }, { status: 400 })

    await db.admin.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Échec de la suppression du compte.' }, { status: 500 })
  }
}
