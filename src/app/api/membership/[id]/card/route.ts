import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { deliverMemberCard } from '@/lib/card-delivery'

// Admin action: (re)generate and (re)send a member's card by email.
// force=true bypasses the cardSentAt guard — used for "renvoyer la carte".
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdmin()
  if (auth.error) return auth.error

  const { id } = await params
  const result = await deliverMemberCard(id, 'admin', { force: true })

  if (result === 'sent') {
    return NextResponse.json({ ok: true })
  }
  return NextResponse.json(
    { error: result === 'failed'
        ? "Échec de l'envoi — voir les événements de paiement."
        : "Envoi impossible : membre non actif/payé, ou SMTP non configuré." },
    { status: result === 'failed' ? 502 : 409 },
  )
}
