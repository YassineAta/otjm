// Flouci payment gateway client.
// Docs: https://docs.flouci.com/api-reference/generate-transaction
//       https://docs.flouci.com/api-reference/verify-transaction
//
// Two operations, both server-only (secret key must never reach the browser):
//   1. createPayment  — POST /api/v2/generate_payment       → { payment_id, link }
//   2. verifyPayment  — GET  /api/v2/verify_payment/{id}    → { status, amount, ... }
//
// Amounts are in MILLIMES on the wire. 1 TND = 1000 millimes. We accept TND
// at the function boundary and convert here so callers can't get it wrong.

const BASE_URL = process.env.FLOUCI_BASE_URL || 'https://developers.flouci.com'

function authHeader() {
  const pub = process.env.FLOUCI_PUBLIC_KEY
  const sec = process.env.FLOUCI_SECRET_KEY
  if (!pub || !sec) {
    throw new Error('Flouci credentials missing: set FLOUCI_PUBLIC_KEY and FLOUCI_SECRET_KEY')
  }
  return `Bearer ${pub}:${sec}`
}

export type FlouciStatus = 'SUCCESS' | 'PENDING' | 'EXPIRED' | 'FAILURE'

export interface CreatePaymentInput {
  amountTnd: number // e.g. 10 for 10 DT
  successLink: string // absolute URL on our site
  failLink: string // absolute URL on our site
  trackingId: string // our membership.id — echoed back on verify
  webhookUrl?: string // absolute URL, optional but recommended
  sessionTimeoutSecs?: number
  acceptCard?: boolean
}

export interface CreatePaymentResult {
  paymentId: string
  link: string
}

export async function createPayment(input: CreatePaymentInput): Promise<CreatePaymentResult> {
  const body = {
    app_token: process.env.FLOUCI_PUBLIC_KEY,
    app_secret: process.env.FLOUCI_SECRET_KEY,
    amount: String(Math.round(input.amountTnd * 1000)), // millimes, as string per docs
    accept_card: input.acceptCard ?? true,
    session_timeout_secs: input.sessionTimeoutSecs ?? 1200,
    success_link: input.successLink,
    fail_link: input.failLink,
    developer_tracking_id: input.trackingId,
    ...(input.webhookUrl ? { webhook: input.webhookUrl } : {}),
  }

  const res = await fetch(`${BASE_URL}/api/v2/generate_payment`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: authHeader(),
    },
    body: JSON.stringify(body),
    cache: 'no-store',
  })

  const json: any = await res.json().catch(() => ({}))
  if (!res.ok || !json?.result?.success) {
    throw new Error(`Flouci generate_payment failed (${res.status}): ${JSON.stringify(json)}`)
  }
  return { paymentId: json.result.payment_id, link: json.result.link }
}

export interface VerifyPaymentResult {
  success: boolean
  status: FlouciStatus
  amountMillimes: number
  trackingId?: string
  raw: any
}

export async function verifyPayment(paymentId: string): Promise<VerifyPaymentResult> {
  const res = await fetch(`${BASE_URL}/api/v2/verify_payment/${encodeURIComponent(paymentId)}`, {
    method: 'GET',
    headers: { Authorization: authHeader() },
    cache: 'no-store',
  })

  const json: any = await res.json().catch(() => ({}))
  const result = json?.result ?? {}
  return {
    success: Boolean(json?.success),
    status: (result.status ?? 'FAILURE') as FlouciStatus,
    amountMillimes: Number(result.amount ?? 0),
    trackingId: result.developer_tracking_id,
    raw: json,
  }
}

// Pricing lives in lib/constants.ts (single source of truth); re-exported
// here under the historical name for payment-flow callers.
export { TIERS as TIER_PRICING } from '@/lib/constants'
