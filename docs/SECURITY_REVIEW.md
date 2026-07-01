# SECURITY_REVIEW.md

> **What is this?** Security posture of the OTJM platform as of the 2026-06-12 audit (commit `675fabc`). Findings are verified against the actual code — including two subagent findings that were _downgraded_ after cross-checking (noted inline). Statuses will be updated as fixes land.
> **Threat model:** public website handling PII of Tunisian doctors (CIN = national ID, phone, DOB) + real money via Flouci + a hidden admin panel. Adversaries: opportunistic scanners, price-tampering users, forged-webhook senders, and anyone hunting the admin URL.

## Verdict in one paragraph

The foundations are better than typical for a project at this stage: security headers are strong, secrets are out of the repo, admin URLs are cloaked, payments use server-side pricing with verify-don't-trust callbacks, and there are three layers of admin auth (middleware → client guard → route helper). The real problems are (1) a **middleware allowlist bug that breaks payments in production**, (2) **missing route-level auth on `/api/membership` POST** that becomes exploitable the moment someone "fixes" (1) carelessly, (3) **plaintext PII at rest**, and (4) several hardening gaps (webhook rate limit, amount cross-check, audit logging, xlsx CVE).

## Findings

Severity reflects _production_ exploitability today, after my cross-check of each subagent claim.

### CRITICAL

**S1 — Payment & public-membership API blocked by middleware in production (availability)**
`src/middleware.ts:6` — `PUBLIC_API = ['/api/auth','/api/contact','/api/newsletter','/api/news','/api/archives','/api/setup']`. `/api/payment/*` is absent, so in prod (`NODE_ENV !== 'development'`; dev returns early at line 11) every `POST /api/payment/create`, the Flouci webhook, and the return redirect get **401 JSON**. The whole revenue flow is dead in production and was never noticed because dev mode skips the middleware entirely.
_Fix:_ add `'/api/payment'` to `PUBLIC_API` — **and only that prefix** (see S2). Add an integration test that runs middleware logic with `NODE_ENV=production`.

**S2 — `/api/membership` POST has no route-level auth and mass-assigns client data**
`src/app/api/membership/route.ts` — POST destructures `price`, `paymentStatus`, `startDate`, `endDate` straight from the request body into the DB. Today the middleware shields it in prod (it's not in PUBLIC_API). **But:** the route has no `requireAdmin()` of its own, so any future middleware edit (e.g. fixing S1 by whitelisting `/api/membership`) instantly enables anyone to mint a `paymentStatus:'paid'` membership for free. The audit subagent rated this CRITICAL-as-exposed; corrected status: **latent critical, one config line away from live**.
_Fix:_ `requireAdmin()` at the top of POST/GET; derive `price` from the tier constant server-side; never accept `paymentStatus` from the client.

**S3 — PII stored in plaintext (CIN, phone, date of birth)**
`prisma/schema.prisma` Membership model. CIN is a national identity number. A DB leak (Atlas credential phishing, backup mishandling) exposes the identity register of a medical-professional association. RGPD/Tunisian Organic Law 2004-63 exposure.
_Fix:_ application-level encryption (AES-256-GCM via a `FIELD_ENCRYPTION_KEY` env var) for `cin`/`phone` at the Prisma layer, or field-level encryption helpers used by the 3 writers (payment create, admin CRUD, bulk import). Decrypt only in admin views.

### HIGH

**S4 — Webhook endpoint: no rate limit, no signature check**
`src/app/api/payment/webhook/route.ts`. The verify-with-secret design means forged payloads can't flip state (good), but each forged call still costs a Flouci API roundtrip + 2 DB queries → cheap DoS amplifier.
_Fix:_ `checkRateLimit` (generous, e.g. 30/60s), and validate a Flouci signature header if the provider supplies one (check Flouci docs; if none, the verify pattern remains the backstop).

**S5 — No amount verification after payment**
Both `return` and `webhook` accept `SUCCESS` without comparing `v.amountMillimes` against `membership.price * 1000`. A Flouci-side partial payment / currency anomaly would still activate membership.
_Fix:_ one comparison + a `paymentStatus:'flagged'`-style mismatch path.

**S6 — `NODE_ENV=development` disables all four auth layers**
`src/middleware.ts:11`, `src/lib/auth.ts`, `AdminGuard.tsx`, `AdminSessionProvider.tsx`. A misconfigured prod deploy (`NODE_ENV` unset/wrong) ships an unauthenticated admin panel. It also means security code paths are never exercised locally — which is exactly how S1 shipped.
_Fix:_ consolidate to a single `IS_AUTH_BYPASSED` helper that additionally requires an explicit `DEV_AUTH_BYPASS=1` env var; document running `next build && next start` locally before payment releases.

**S7 — Role downgrade confusion in `authorize()`**
`options.tsx:33` maps Admin-collection `superadmin → 'admin'` and anything else → `'member'` for the mirror User row _and_ the JWT. A non-superadmin Admin therefore receives role `member` and is locked out by middleware (`ADMIN_ROLES = ['admin','superadmin']`) despite valid credentials. Today there is likely a single superadmin so it's dormant; it breaks the day a second admin is added.
_Fix:_ carry the Admin-collection role into the JWT unchanged; keep the User-row mapping separate.

**S8 — `xlsx@0.18.5` has known prototype-pollution CVEs**
CVE-2023-30533 family; the SheetJS CDN versions ≥0.19.3 contain the fix but the npm registry package is frozen at 0.18.5. Admin-only surface (bulk import), but a malicious spreadsheet from a colleague is a realistic vector.
_Fix:_ migrate the import endpoint to the official SheetJS CDN distribution or to `exceljs`; or parse CSV only.

### MEDIUM

**S9 — Unpublished news drafts are publicly readable** — `GET /api/news` with no `published` param returns drafts (`where = {}`), and the route is in PUBLIC_API. _Fix:_ default to `published: true` unless the caller is an admin.
**S10 — Payment error responses leak gateway internals** — `create/route.ts:81` returns `err.message` (includes Flouci response JSON). _Fix:_ log server-side, return generic message.
**S11 — In-memory rate limiter** — `src/lib/rate-limit.ts` per-process Map; resets on restart, multiplies by instance count. Acceptable at current single-instance scale; becomes a real gap on serverless/multi-instance. _Fix when scaling:_ Redis/Upstash. Documented limitation.
**S12 — No audit logging of admin mutations or payment transitions** — three writers mutate Membership with no trail. _Fix:_ lightweight `AuditLog` collection (who/what/when/delta) written from `requireAdmin`-protected mutations + payment transitions.
**S13 — CSP allows `script-src 'unsafe-inline'` in prod + leftover `frame-src https://www.cha9a9a.tn`** — cha9a9a was the _previous_ payment provider, removed in commit `5165bfc`; the CSP entry survived. _Fix:_ drop the frame-src entry; nonce-based CSP is a stretch goal (Next.js inline runtime makes it non-trivial).

### LOW / accepted

- **No pagination on admin list endpoints** (`/api/membership` GET et al.) — memory/latency issue at scale, admin-only. Backlog.
- **Bulk import via `Promise.all` of N creates** — no transaction, partial-failure risk. Use `createMany`. Backlog (also a perf item).
- **NextAuth CSRF** — NextAuth's built-in double-submit CSRF protection applies to its own endpoints; state-changing custom API routes rely on JWT-in-cookie + SameSite default (Lax). Risk is low (no GET mutations); revisit if cookies change.
- **Archive PATCH lacks length validation** — admin-only; covered by the planned zod schema work.

### Corrected (subagent claims rejected after verification)

- ~~"Public archive record enumeration (CRITICAL)"~~ — archives are deliberately public content rendered on `/archives`; `GET /api/archives/[id]` being open is by design. No finding.
- ~~"Membership POST publicly exploitable today (CRITICAL)"~~ — middleware blocks it in prod; reclassified as **latent** (S2).

## What is already good (keep it)

- `.env` gitignored, no secrets in git history scan of `src/`; `.env.example` documents every variable.
- Strong header set in `next.config.ts` (HSTS preload, X-Frame-Options DENY, nosniff, Referrer-Policy, Permissions-Policy).
- Admin cloaking: secret slug rewrite + 404 (not 401) on `/admin` — doesn't confirm the panel exists.
- bcrypt password hashing; JWT sessions; NextAuth typed via `types/next-auth.d.ts`.
- Server-side price authority + verify-don't-trust + monotonic payment state transitions.
- `/api/setup` self-locks after the first admin exists and is rate-limited (3/60s).
- Public form endpoints (contact, newsletter, payment create) are rate-limited and validate/sanitize email input.

## Fix order (security only — merged into the global plan in EXECUTIVE_SUMMARY.md)

1. S1 + S2 together (they interlock: whitelist `/api/payment` only, add route auth to membership).
2. S5 amount check + S4 webhook rate limit (same files, one PR).
3. S6 dev-bypass consolidation, S7 role fix.
4. S3 PII encryption (needs key management decision + data migration for existing rows).
5. S8 xlsx replacement, S9 drafts default, S10 error scrubbing, S13 CSP cleanup.
6. S12 audit log (pairs naturally with the card-generation feature, which also wants an events trail).
