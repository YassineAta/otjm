// Orchestrates "member paid → member holds their card in their inbox".
//
// Idempotency contract: callers may invoke this any number of times (return
// callback, webhook, admin resend) — a card email goes out at most once
// unless force=true, guarded by Membership.cardSentAt. Card numbers are
// assigned once and never change (Membership.cardNumber, unique).
//
// Failure contract: this must NEVER throw into a payment callback. All
// failures are logged as PaymentEvents (type email_failed) so admins can
// see and resend from the panel.
import { db } from '@/lib/db'
import { generateMemberCard, formatCardNumber } from '@/lib/card'
import { isMailConfigured, sendMemberCardEmail } from '@/lib/mail'

async function logEvent(membershipId: string, type: string, detail: string, source: string) {
  try {
    await db.paymentEvent.create({ data: { membershipId, type, detail, source } })
  } catch (err) {
    console.error('[card-delivery] failed to write PaymentEvent', err)
  }
}

// Next sequential card number. The unique index on cardNumber is the real
// guard — on a concurrent clash we retry once with a fresh max.
async function assignCardNumber(membershipId: string): Promise<number> {
  for (let attempt = 0; attempt < 2; attempt++) {
    const top = await db.membership.findFirst({
      where: { cardNumber: { not: null } },
      orderBy: { cardNumber: 'desc' },
      select: { cardNumber: true },
    })
    const next = (top?.cardNumber ?? 0) + 1
    try {
      await db.membership.update({ where: { id: membershipId }, data: { cardNumber: next } })
      return next
    } catch (err) {
      if (attempt === 1) throw err
    }
  }
  throw new Error('unreachable')
}

export async function deliverMemberCard(
  membershipId: string,
  source: 'return' | 'webhook' | 'admin',
  opts: { force?: boolean } = {},
): Promise<'sent' | 'skipped' | 'failed'> {
  try {
    const m = await db.membership.findUnique({ where: { id: membershipId } })
    if (!m) return 'skipped'
    if (m.paymentStatus !== 'paid' || m.status !== 'active') {
      await logEvent(membershipId, 'email_skipped', 'membership not active/paid', source)
      return 'skipped'
    }
    if (m.cardSentAt && !opts.force) return 'skipped' // already delivered

    if (!isMailConfigured()) {
      await logEvent(membershipId, 'email_skipped', 'smtp_not_configured', source)
      return 'skipped'
    }

    const cardNumber = m.cardNumber ?? (await assignCardNumber(m.id))
    const { backPng, pdf } = await generateMemberCard({
      fullName: m.name,
      cardNumber,
      validUntil: m.endDate,
    })

    await sendMemberCardEmail({
      to: m.email,
      fullName: m.name,
      cardNumberLabel: formatCardNumber(cardNumber),
      png: backPng,
      pdf,
    })

    await db.membership.update({ where: { id: m.id }, data: { cardSentAt: new Date() } })
    await logEvent(m.id, 'email_sent', `card ${formatCardNumber(cardNumber)} → ${m.email}`, source)
    return 'sent'
  } catch (err) {
    console.error('[card-delivery] failed', err)
    await logEvent(
      membershipId,
      'email_failed',
      err instanceof Error ? err.message : 'unknown error',
      source,
    )
    return 'failed'
  }
}
