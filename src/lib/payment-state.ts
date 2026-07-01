// Single owner of the Membership payment state machine.
// Both Flouci callbacks (synchronous /api/payment/return and asynchronous
// /api/payment/webhook) funnel through settlePayment() so the rules live once:
//
//   1. Never trust the caller — re-verify with Flouci using our secret key.
//   2. Never activate on a wrong amount — verified amount must equal our price.
//   3. Transitions are monotonic — only a 'pending' row can change; a 'paid'
//      row is never demoted, and replays/duplicate callbacks are no-ops.
//   4. Every step leaves a PaymentEvent — the audit trail admins can read.
import { db } from '@/lib/db'
import { verifyPayment } from '@/lib/flouci'

export type SettleOutcome =
  | 'activated' // pending → paid+active (the happy path)
  | 'payment_failed' // pending → failed (Flouci says FAILURE/EXPIRED)
  | 'still_pending' // Flouci still processing — leave row untouched
  | 'already_final' // row was settled earlier (duplicate callback) — no-op
  | 'amount_mismatch' // SUCCESS but wrong amount — NOT activated, flagged for admin
  | 'unknown_payment' // no membership carries this flouciPaymentId
  | 'verify_error' // Flouci verify call itself failed

export interface SettleResult {
  outcome: SettleOutcome
  membershipId?: string
  /** Membership.paymentStatus after settlement — lets callers distinguish a
   *  row that was already 'paid' from one already 'failed'. */
  paymentStatus?: string
}

async function logEvent(event: {
  membershipId: string
  flouciPaymentId?: string | null
  type: string
  fromStatus?: string | null
  toStatus?: string | null
  amountMillimes?: number | null
  detail?: string | null
  source: string
}) {
  // The trail must never break the payment flow — log failures are swallowed
  // (they'll surface in server logs instead).
  try {
    await db.paymentEvent.create({ data: event })
  } catch (err) {
    console.error('[payment-state] failed to write PaymentEvent', err)
  }
}

export async function settlePayment(
  paymentId: string,
  source: 'return' | 'webhook',
): Promise<SettleResult> {
  let v
  try {
    v = await verifyPayment(paymentId)
  } catch (err) {
    console.error(`[payment-state] verify failed for ${paymentId} via ${source}`, err)
    return { outcome: 'verify_error' }
  }

  const membership = await db.membership.findUnique({ where: { flouciPaymentId: paymentId } })
  if (!membership) return { outcome: 'unknown_payment' }

  if (membership.paymentStatus !== 'pending') {
    await logEvent({
      membershipId: membership.id,
      flouciPaymentId: paymentId,
      source,
      type: 'already_final',
      fromStatus: membership.paymentStatus,
    })
    return {
      outcome: 'already_final',
      membershipId: membership.id,
      paymentStatus: membership.paymentStatus,
    }
  }

  if (v.success && v.status === 'SUCCESS') {
    const expectedMillimes = Math.round(membership.price * 1000)
    if (v.amountMillimes !== expectedMillimes) {
      // Wrong amount: do NOT activate. Row stays pending; admins see the event.
      await logEvent({
        membershipId: membership.id,
        flouciPaymentId: paymentId,
        source,
        type: 'amount_mismatch',
        fromStatus: 'pending',
        amountMillimes: v.amountMillimes,
        detail: `expected ${expectedMillimes} millimes`,
      })
      return { outcome: 'amount_mismatch', membershipId: membership.id }
    }

    await db.membership.update({
      where: { id: membership.id },
      data: { paymentStatus: 'paid', status: 'active' },
    })
    await logEvent({
      membershipId: membership.id,
      flouciPaymentId: paymentId,
      source,
      type: 'verified_success',
      fromStatus: 'pending',
      toStatus: 'paid',
      amountMillimes: v.amountMillimes,
    })
    return { outcome: 'activated', membershipId: membership.id, paymentStatus: 'paid' }
  }

  if (v.status === 'FAILURE' || v.status === 'EXPIRED') {
    await db.membership.update({
      where: { id: membership.id },
      data: { paymentStatus: 'failed' },
    })
    await logEvent({
      membershipId: membership.id,
      flouciPaymentId: paymentId,
      source,
      type: 'verified_failure',
      fromStatus: 'pending',
      toStatus: 'failed',
      detail: v.status,
    })
    return { outcome: 'payment_failed', membershipId: membership.id, paymentStatus: 'failed' }
  }

  // PENDING at Flouci: leave the row alone; webhook or a retry will resolve it.
  return { outcome: 'still_pending', membershipId: membership.id }
}
