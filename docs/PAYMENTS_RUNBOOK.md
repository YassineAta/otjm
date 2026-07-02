# PAYMENTS_RUNBOOK.md

> **What is this?** How to operate, test, and debug the Flouci payment flow. Written for whoever is on duty when "the payment didn't work" arrives by phone.

## How the flow works (30 seconds)

1. `POST /api/payment/create` validates the signup (zod), upserts a `pending` Membership, asks Flouci for a payment link (amount from server-side `TIER_PRICING` — client input is never trusted), stores `flouciPaymentId`, logs a `created` PaymentEvent, returns the link.
2. User pays on Flouci's page.
3. Two independent callbacks race (either may arrive first; both are safe):
   - `GET /api/payment/return` — user's browser redirect.
   - `POST /api/payment/webhook` — Flouci server-to-server (rate-limited 30/60s).
4. Both call `settlePayment()` (`src/lib/payment-state.ts`), which **re-verifies with Flouci using our secret key**, checks the verified amount equals our price, and applies a monotonic transition: `pending → paid+active` or `pending → failed`. Settled rows are never changed again. Every step writes a `PaymentEvent` row.

## Test-mode validation (do this before go-live and after any payment change)

Prereqs: Flouci **test** keys in `.env` (`FLOUCI_PUBLIC_KEY`/`FLOUCI_SECRET_KEY` from the Flouci business dashboard, test mode), `NEXT_PUBLIC_APP_URL` set, a tunnel (e.g. `ngrok http 3000`) if you want the webhook to reach your machine, and **a production-mode local run** — dev mode would bypass the middleware and hide allowlist bugs:

```powershell
npm run build
npm run start          # NODE_ENV=production via cross-env
```

Checklist:

1. Open `/membership`, complete the modal with a test email → you must land on the Flouci test payment page (if you get a JSON 401 instead, the middleware allowlist regressed — see `src/middleware.ts` PUBLIC_API).
2. Pay with Flouci's test card → you must land on `/membership/success`.
3. Verify DB: the Membership row is `paymentStatus: 'paid'`, `status: 'active'`; `PaymentEvent` contains `created` + `verified_success` (source `return` or `webhook` — whichever won the race; the loser logs `already_final`).
4. Repeat with an abandoned/expired payment → row becomes `failed`, page `/membership/failed`.
5. Replay attack drill: re-open the return URL with the same `payment_id` → no state change (`already_final`), success page only if the row really is paid.
6. Run `npm test` — the state-machine invariants are pinned in `src/lib/__tests__/payment-state.test.ts`.

After schema changes (e.g. `PaymentEvent` added 2026-06-12): run `npx prisma db push` once against the real `DATABASE_URL` to sync indexes.

## Debugging a reported payment problem

1. Find the membership: admin panel → members, or query by email.
2. Read its `PaymentEvent` trail (by `membershipId`). The trail tells you exactly which callback arrived, what Flouci answered, and why a transition did or didn't happen.
3. Interpret:
   - `created` only, row `pending` → user never completed payment, or callbacks can't reach the server (check `NEXT_PUBLIC_APP_URL` and middleware).
   - `amount_mismatch` → Flouci reported SUCCESS with a different amount than our price; the row stays `pending` **on purpose**. Verify in the Flouci dashboard, then resolve manually via the admin panel.
   - `verified_failure` → payment failed/expired at Flouci. User can simply retry; `create` reuses unpaid rows by email.
   - `already_final` repeats → harmless duplicate callbacks.
4. The row is wrong but Flouci's dashboard shows paid? Re-trigger settlement by visiting `/api/payment/return?payment_id=<id>` — it re-verifies and applies the same safe rules.

## Invariants (do not break these in future changes)

- The client never supplies an amount; `TIER_PRICING` is the only price source.
- No state change without a fresh `verifyPayment()` against Flouci.
- No activation when verified amount ≠ `membership.price * 1000` millimes.
- `pending` is the only mutable state; transitions are one-way.
- Every transition (and refusal) leaves a `PaymentEvent`.
