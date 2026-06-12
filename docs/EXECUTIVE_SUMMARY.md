# EXECUTIVE_SUMMARY.md

> **What is this?** The one document to read first. State of the OTJM platform after the full 2026-06-12 audit, and the prioritized plan. Details live in: `SECURITY_REVIEW.md`, `PERFORMANCE_AUDIT.md`, `TECHNICAL_DEBT.md`, `PROJECT_ARCHITECTURE.md`, `SYSTEM_MAP.md`, `FEATURE_STATUS.md`, `DECISIONS_LOG.md`.

## State of the system in five sentences

OTJM is a Next.js 15 + Prisma/MongoDB membership platform with a bilingual public site, a well-hidden admin panel, and a freshly built Flouci payment flow whose *core logic is sound* (server-side pricing, verify-don't-trust, monotonic state). **However, a one-line middleware allowlist bug means the entire payment flow returns 401 in production** — it only ever worked in dev because dev mode skips the middleware. The promised member card and its email delivery do not exist (no email subsystem at all), making the post-payment experience a broken promise. The admin panel works but carries ~800 lines of copy-paste duplication, a tier-naming split that prevents admins from editing publicly-created memberships, and six dead dependencies. Security fundamentals (headers, secret handling, admin cloaking, bcrypt/JWT) are genuinely good; the gaps are plaintext PII, missing route-level auth on one latent endpoint, and payment-hardening details.

## The five findings that matter most

| # | Finding | Where | Why it matters |
|---|---|---|---|
| 1 | 🔴 Payments dead in prod (middleware allowlist) | `src/middleware.ts:6` | Zero revenue possible; invisible in dev |
| 2 | 🔴 Latent: membership POST mass-assigns `paymentStatus`/`price` | `api/membership/route.ts` | One careless whitelist edit away from free "paid" memberships — interlocks with #1's fix |
| 3 | 🔴 Card + email delivery promised to paying users, not built | success page / absent subsystem | Product integrity + the association's credibility |
| 4 | 🟡 PII (CIN, phone, DOB) plaintext in MongoDB | `prisma/schema.prisma` | National-ID register of doctors; RGPD exposure |
| 5 | 🟡 All public pages client-rendered with fetch waterfalls | `src/app/*.tsx` | LCP/SEO; also why the homepage is an 863-line monolith |

## Improvement plan (phased, each phase independently shippable)

### Phase A — Un-break production & harden payments *(small diffs, highest stakes)*
1. Middleware: whitelist `/api/payment` (only); route-level `requireAdmin` + zod on `/api/membership`; prod-mode middleware test.
2. Flouci hardening: amount cross-check on verify, webhook rate limit, error-detail scrubbing, payment-event log (who/what/when), CSP cha9a9a cleanup.
3. End-to-end test-mode validation with Flouci test keys: create → pay → return → webhook → DB state, documented as a runbook.
4. Fix admin role-downgrade bug (S7) + consolidate the four `NODE_ENV` auth bypasses behind one explicit flag (S6).

### Phase B — Card generator + email delivery *(the feature)*
1. One-time export of `cardhonneur.ai` → flattened 300-DPI PNG template (+ agreed personalization zones for name, tier, member ID, validity, in FR + AR).
2. `src/lib/card.ts`: sharp + SVG text overlay → personalized PNG (and PDF via pdf-lib). Pure function: `(member) → Buffer`. Unit-testable with snapshot fixtures.
3. `src/lib/mail.ts`: nodemailer/SMTP (env-configured), bilingual card-delivery template.
4. Wire into payment success transition (both return + webhook paths, idempotent — send once), plus an admin "regenerate/resend card" action and a `cardSentAt` field.
5. Mobile-friendly: card PNG attached + inline preview; success page updated to reflect reality.

### Phase C — Debt burn-down *(makes everything after cheaper)*
1. Delete dead code/deps (toast system, dnd-kit, resizable-panels, next-intl, zustand, nodemon, createAdmin.js, LangSync).
2. Unify tiers/pricing into `lib/constants.ts` (fixes the admin edit bug).
3. `lib/api.ts` response helpers + zod schemas at every boundary.
4. Extract `useCrudApi`/`useModalForm`/`useTableFilter`; refactor admin pages one at a time (members → news → archives → users), build green between each.

### Phase D — Performance *(measured before/after, see PERFORMANCE_AUDIT.md)*
1. Capture baseline (build route table + Lighthouse).
2. Server-componentize public data fetching; split homepage monolith into sections.
3. next/image + AVIF/WebP for the 3 large JPEGs; hero `priority`.
4. Caching for news/archives content (revalidate 1h/24h).

### Phase E — PII & polish
1. Field-level encryption for `cin`/`phone` + key management + migration of existing rows.
2. xlsx → exceljs (CVE), bulk import via `createMany`.
3. Drafts no longer public by default; pagination on admin lists.

## Effort & risk profile

| Phase | Size | Risk | Depends on |
|---|---|---|---|
| A | S–M | Low (small, testable diffs) | Flouci test keys from the dashboard |
| B | M | Medium (fonts/Arabic shaping, SMTP creds) | A; card-zone design sign-off; SMTP credentials |
| C | M | Low–Med (mechanical, staged) | — |
| D | M | Medium (rendering changes) | C helps |
| E | S–M | Medium (data migration) | — |

## Evidence policy

No improvement is claimed without evidence: duplication counts come from the measured audit; performance changes get before/after numbers in `PERFORMANCE_AUDIT.md`; security fixes reference finding IDs (S1–S13); every phase ends with a green `next build` and an `IMPLEMENTATION_JOURNAL.md` entry.
