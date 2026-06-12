import { NextRequest, NextResponse } from 'next/server'
import { checkRateLimit } from '@/lib/rate-limit'
import { settlePayment } from '@/lib/payment-state'

// Flouci POSTs here when a payment changes state. We DON'T trust the body —
// settlePayment() re-verifies with our secret key before any state change,
// so a forged call can trigger work but never a false activation.
export async function POST(req: NextRequest) {
  // Generous limit: real webhooks are rare; this only blunts flooding.
  const limited = checkRateLimit(req, { limit: 30, windowSeconds: 60 })
  if (limited) return limited

  let payload: unknown = {}
  try { payload = await req.json() } catch { /* empty body is fine */ }

  const body = payload as { payment_id?: string; result?: { payment_id?: string } }
  const paymentId =
    body?.payment_id ||
    body?.result?.payment_id ||
    req.nextUrl.searchParams.get('payment_id')

  if (!paymentId) {
    return NextResponse.json({ ok: false, reason: 'missing_payment_id' }, { status: 400 })
  }

  const { outcome } = await settlePayment(paymentId, 'webhook')

  switch (outcome) {
    case 'verify_error':
      return NextResponse.json({ ok: false, reason: 'verify_error' }, { status: 502 })
    case 'unknown_payment':
      return NextResponse.json({ ok: false, reason: 'unknown_payment' }, { status: 404 })
    default:
      // activated / payment_failed / still_pending / already_final / amount_mismatch:
      // acknowledged — state is settled (or intentionally held) on our side.
      return NextResponse.json({ ok: true, outcome })
  }
}
