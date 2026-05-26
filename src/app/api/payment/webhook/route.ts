import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyPayment } from '@/lib/flouci'

// Flouci POSTs here when a payment changes state. We DON'T trust the body —
// we re-verify with our secret key to defend against forged webhook calls.
export async function POST(req: NextRequest) {
  let payload: any = {}
  try { payload = await req.json() } catch { /* empty body is fine */ }

  const paymentId =
    payload?.payment_id ||
    payload?.result?.payment_id ||
    req.nextUrl.searchParams.get('payment_id')

  if (!paymentId) {
    return NextResponse.json({ ok: false, reason: 'missing_payment_id' }, { status: 400 })
  }

  let v
  try { v = await verifyPayment(paymentId) }
  catch { return NextResponse.json({ ok: false, reason: 'verify_error' }, { status: 502 }) }

  const membership = await db.membership.findUnique({ where: { flouciPaymentId: paymentId } })
  if (!membership) {
    return NextResponse.json({ ok: false, reason: 'unknown_payment' }, { status: 404 })
  }

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
  }

  return NextResponse.json({ ok: true })
}
