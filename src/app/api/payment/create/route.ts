import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { checkRateLimit } from '@/lib/rate-limit'
import { createPayment, TIER_PRICING } from '@/lib/flouci'

function appBaseUrl(req: NextRequest) {
  // Prefer explicit config (correct in prod behind proxy). Fall back to request origin.
  return (process.env.NEXT_PUBLIC_APP_URL || req.nextUrl.origin).replace(/\/$/, '')
}

export async function POST(req: NextRequest) {
  const limited = checkRateLimit(req, { limit: 5, windowSeconds: 60 })
  if (limited) return limited

  let data: any
  try { data = await req.json() } catch {
    return NextResponse.json({ message: 'Invalid JSON body.' }, { status: 400 })
  }

  const { fullName, email, phone, cin, dateOfBirth, faculty, memberStatus, tier } = data

  if (!fullName || !email || !tier || !memberStatus) {
    return NextResponse.json({ message: 'Champs requis manquants.' }, { status: 400 })
  }

  const pricing = TIER_PRICING[String(tier).toLowerCase()]
  if (!pricing) {
    return NextResponse.json({ message: 'Tier invalide.' }, { status: 400 })
  }

  const existing = await db.membership.findUnique({ where: { email } })
  if (existing?.paymentStatus === 'paid') {
    return NextResponse.json(
      { message: 'Un membre payé existe déjà avec cet email.' },
      { status: 409 },
    )
  }

  const now = new Date()
  const oneYear = new Date(now); oneYear.setFullYear(now.getFullYear() + 1)

  const membership = existing
    ? await db.membership.update({
        where: { id: existing.id },
        data: {
          name: fullName, tier, price: pricing.priceTnd,
          memberStatus, faculty, cin, phone,
          dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
          paymentMethod: 'Flouci', paymentStatus: 'pending', status: 'pending',
          flouciPaymentId: null,
        },
      })
    : await db.membership.create({
        data: {
          email, name: fullName, tier, price: pricing.priceTnd,
          memberStatus, faculty, cin, phone,
          dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
          startDate: now, endDate: oneYear,
          paymentMethod: 'Flouci', paymentStatus: 'pending', status: 'pending',
        },
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

    return NextResponse.json({ link, paymentId }, { status: 200 })
  } catch (err: any) {
    return NextResponse.json(
      { message: 'Échec de la création du paiement.', detail: err?.message },
      { status: 502 },
    )
  }
}
