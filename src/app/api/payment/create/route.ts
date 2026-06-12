import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { checkRateLimit } from '@/lib/rate-limit'
import { createPayment, TIER_PRICING } from '@/lib/flouci'
import { paymentCreateSchema, firstZodError } from '@/lib/schemas'

function appBaseUrl(req: NextRequest) {
  // Prefer explicit config (correct in prod behind proxy). Fall back to request origin.
  return (process.env.NEXT_PUBLIC_APP_URL || req.nextUrl.origin).replace(/\/$/, '')
}

export async function POST(req: NextRequest) {
  const limited = checkRateLimit(req, { limit: 5, windowSeconds: 60 })
  if (limited) return limited

  let raw: unknown
  try { raw = await req.json() } catch {
    return NextResponse.json({ message: 'Invalid JSON body.' }, { status: 400 })
  }

  const parsed = paymentCreateSchema.safeParse(raw)
  if (!parsed.success) {
    return NextResponse.json({ message: firstZodError(parsed.error) }, { status: 400 })
  }
  const data = parsed.data

  // Price comes from the server-side table, never from the client.
  const pricing = TIER_PRICING[data.tier]
  if (!pricing) {
    return NextResponse.json({ message: 'Tier invalide.' }, { status: 400 })
  }

  const existing = await db.membership.findUnique({ where: { email: data.email } })
  if (existing?.paymentStatus === 'paid') {
    return NextResponse.json(
      { message: 'Un membre payé existe déjà avec cet email.' },
      { status: 409 },
    )
  }

  const now = new Date()
  const oneYear = new Date(now); oneYear.setFullYear(now.getFullYear() + 1)

  const fields = {
    name: data.fullName, tier: data.tier, price: pricing.priceTnd,
    memberStatus: data.memberStatus, faculty: data.faculty ?? null,
    cin: data.cin ?? null, phone: data.phone ?? null,
    dateOfBirth: data.dateOfBirth ?? null,
    paymentMethod: 'Flouci', paymentStatus: 'pending', status: 'pending',
  }

  const membership = existing
    ? await db.membership.update({
        where: { id: existing.id },
        data: { ...fields, flouciPaymentId: null },
      })
    : await db.membership.create({
        data: { ...fields, email: data.email, startDate: now, endDate: oneYear },
      })

  const base = appBaseUrl(req)
  try {
    const { paymentId, link } = await createPayment({
      amountTnd: pricing.priceTnd,
      trackingId: membership.id,
      successLink: `${base}/api/payment/return`,
      failLink: `${base}/api/payment/return`,
      webhookUrl: `${base}/api/payment/webhook`,
    })

    await db.membership.update({
      where: { id: membership.id },
      data: { flouciPaymentId: paymentId },
    })
    await db.paymentEvent.create({
      data: {
        membershipId: membership.id, flouciPaymentId: paymentId,
        type: 'created', toStatus: 'pending',
        amountMillimes: Math.round(pricing.priceTnd * 1000), source: 'create',
      },
    }).catch(() => { /* trail must not block checkout */ })

    return NextResponse.json({ link, paymentId }, { status: 200 })
  } catch (err) {
    // Gateway details go to server logs only — never to the client (S10).
    console.error('[payment/create] Flouci generate_payment failed', err)
    return NextResponse.json(
      { message: 'Échec de la création du paiement. Veuillez réessayer.' },
      { status: 502 },
    )
  }
}
