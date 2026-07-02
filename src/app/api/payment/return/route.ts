import { NextRequest, NextResponse } from 'next/server'
import { settlePayment } from '@/lib/payment-state'
import { deliverMemberCard } from '@/lib/card-delivery'

function siteBase(req: NextRequest) {
  return (process.env.NEXT_PUBLIC_APP_URL || req.nextUrl.origin).replace(/\/$/, '')
}

// The user lands here when Flouci redirects them back after paying (or
// abandoning). State logic lives in settlePayment(); this route only maps
// outcomes to the right landing page.
export async function GET(req: NextRequest) {
  const paymentId = req.nextUrl.searchParams.get('payment_id')
  const base = siteBase(req)
  if (!paymentId) {
    return NextResponse.redirect(`${base}/membership/failed?reason=missing_id`, { status: 303 })
  }

  const { outcome, paymentStatus, membershipId } = await settlePayment(paymentId, 'return')

  switch (outcome) {
    case 'activated':
      // Fire-and-forget: the user gets their success page immediately; card
      // generation+email runs in the background (idempotent, self-logging).
      if (membershipId) void deliverMemberCard(membershipId, 'return')
      return NextResponse.redirect(`${base}/membership/success`, { status: 303 })
    case 'already_final': {
      // Duplicate callback (e.g. user refreshed). Success only if the row
      // really settled as paid — it may equally have settled as failed.
      const dest = paymentStatus === 'paid' ? 'success' : 'failed?reason=already_settled'
      return NextResponse.redirect(`${base}/membership/${dest}`, { status: 303 })
    }
    case 'still_pending':
      return NextResponse.redirect(`${base}/membership/failed?reason=pending`, { status: 303 })
    case 'amount_mismatch':
      return NextResponse.redirect(`${base}/membership/failed?reason=verification`, { status: 303 })
    case 'verify_error':
      return NextResponse.redirect(`${base}/membership/failed?reason=verify_error`, { status: 303 })
    case 'unknown_payment':
      return NextResponse.redirect(`${base}/membership/failed?reason=unknown_payment`, {
        status: 303,
      })
    default:
      return NextResponse.redirect(`${base}/membership/failed`, { status: 303 })
  }
}
