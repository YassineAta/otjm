import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyPayment } from '@/lib/flouci'

function siteBase(req: NextRequest) {
  return (process.env.NEXT_PUBLIC_APP_URL || req.nextUrl.origin).replace(/\/$/, '')
}

export async function GET(req: NextRequest) {
  const paymentId = req.nextUrl.searchParams.get('payment_id')
  const base = siteBase(req)
  if (!paymentId) {
    return NextResponse.redirect(`${base}/membership/failed?reason=missing_id`, { status: 303 })
  }

  let v
  try {
    v = await verifyPayment(paymentId)
  } catch {
    return NextResponse.redirect(`${base}/membership/failed?reason=verify_error`, { status: 303 })
  }

  const membership = await db.membership.findUnique({ where: { flouciPaymentId: paymentId } })
  if (!membership) {
    return NextResponse.redirect(`${base}/membership/failed?reason=unknown_payment`, { status: 303 })
  }

  // Only transition from pending — never demote a paid row.
  if (membership.paymentStatus === 'pending') {
    if (v.success && v.status === 'SUCCESS') {
      await db.membership.update({
        where: { id: membership.id },
        data: { paymentStatus: 'paid', status: 'active' },
      })
    } else if (v.status === 'FAILURE' || v.status === 'EXPIRED') {
      await db.membership.update({
        where: { id: membership.id },
        data: { paymentStatus: 'failed' },
      })
    }
    // PENDING: leave as-is; webhook or retry will resolve it.
  }

  const ok = v.success && v.status === 'SUCCESS'
  return NextResponse.redirect(`${base}/membership/${ok ? 'success' : 'failed'}`, { status: 303 })
}
