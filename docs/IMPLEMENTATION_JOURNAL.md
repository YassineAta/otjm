# IMPLEMENTATION_JOURNAL.md

> **What is this?** Running log of work sessions: what was done, what was decided, what's risky, what's next. Newest entry last. The other docs describe the system; this one describes the *journey* — read it to know where we left off.

---

## 2026-06-12 — Session 1: Full audit (no code changes)

**Goal:** Build a complete, evidence-based picture before touching anything.

**Done:**
- Recon of repo, payment flow, middleware, schema, configs (direct read).
- Four parallel audit passes: security, code quality/duplication, performance, architecture/flows.
- Cross-checked subagent findings against source; rejected 2 false criticals (archive "leak" is by-design public content; membership POST is middleware-shielded in prod → reclassified *latent*).
- Inspected `cardhonneur.ai` (PDF-compatible): landscape CR80-style card, maroon, gold "INVICTUS", OTJM seal, fist-with-stethoscope artwork, Arabic motto banner. Personalization zones TBD with owner.
- Wrote the full docs set: EXECUTIVE_SUMMARY, PROJECT_ARCHITECTURE, SYSTEM_MAP, SECURITY_REVIEW (S1–S13), PERFORMANCE_AUDIT (P1–P6 + harness), TECHNICAL_DEBT (D1–D7), FEATURE_STATUS, DECISIONS_LOG (ADR-001…006).

**Key discoveries (the load-bearing three):**
1. `middleware.ts` PUBLIC_API omits `/api/payment` → **payments 401 in production**; invisible locally because dev bypasses middleware.
2. The fix interlocks with a latent mass-assignment hole in `/api/membership` POST — whitelist must be surgical and the route needs its own auth+zod.
3. No email subsystem exists despite the success page promising card delivery — Phase B builds card (sharp+SVG, ADR-004) + mail (nodemailer SMTP, ADR-005).

**Risks / open questions for the owner:**
- Flouci **test keys** needed before Phase A validation (from the Flouci business dashboard).
- SMTP credentials needed for Phase B (any mailbox works to start; Gmail app-password acceptable).
- Card personalization-zone decision: name/ID/validity placement (proposal will be mocked before implementation).
- Where is production deployed? (standalone output suggests VPS — affects how we test the prod middleware path and webhook reachability.)

**Decisions:** ADR-001 (stay Next.js), ADR-002 (ratify Flouci pattern), ADR-003 (keep custom i18n), ADR-004/005/006 proposed pending approval.

**Next steps:** Await owner approval of the phased plan in EXECUTIVE_SUMMARY.md → start Phase A.

**Build/test status:** untouched (no code modified this session).

---

## 2026-06-12 — Session 2: Phase A — un-break & harden payments

**Done:**
- **S1 fixed** — `/api/payment` added to middleware PUBLIC_API (surgically: `/api/membership` deliberately NOT added; comment in code explains why).
- **S2 fixed** — `/api/membership` POST now requires admin + zod validation (`adminMembershipCreateSchema`); mass-assignment of `price`/`paymentStatus` from public callers is structurally impossible (schema strips unknown fields, route requires auth, middleware still blocks — three layers).
- **New `src/lib/schemas.ts`** — zod at the payment + membership boundaries (ADR-006 started). Public schema rejects unknown tiers, normalizes emails, treats empty strings as absent.
- **New `src/lib/payment-state.ts`** — single `settlePayment()` state machine used by both callbacks. Adds **amount cross-check (S5)**: SUCCESS with wrong amount → `amount_mismatch`, row stays pending, admin reviews. Adds **PaymentEvent audit trail (S12 partial)** — new Prisma model, append-only.
- **S4 fixed** — webhook rate-limited (30/60s). **S10 fixed** — Flouci error details now logged server-side only. **S13 fixed** — cha9a9a frame-src removed from CSP.
- **S7 fixed** — JWT now carries the real Admin-collection role (was downgraded via the mirror User row, locking out non-superadmin admins).
- **S6 fixed (server-side)** — middleware + `requireAdmin` bypass now needs `NODE_ENV=development` **and** `DEV_AUTH_BYPASS=1` (added to `.env`/`.env.example`). Client guards (AdminGuard/AdminSessionProvider) keep the NODE_ENV-only bypass: they're UX, not enforcement — server gates are the security boundary.
- **Test infrastructure introduced** — vitest (`npm test`), 16 tests: payment state-machine invariants (8) + schema boundaries (8). One test caught a real zod bug (empty-string handling) before it shipped — fixed via `optionalText()` preprocessor.
- **Build env fix** — `outputFileTracingRoot` pinned; a stray `C:\Users\SBS\package-lock.json` was making Next nest the standalone output and break the `ncp` copy step.
- Wrote `docs/PAYMENTS_RUNBOOK.md` (test-mode E2E checklist, debugging guide, invariants).
- Captured perf baseline: `/` = 183 kB First Load JS (route table in build output).

**Bug found & fixed during self-review:** my first `return` route showed the success page for *any* `already_final` row — including ones settled as `failed`. `settlePayment` now returns the settled `paymentStatus`; a regression test pins it.

**Deferred / blocked:**
- Live test-mode E2E run blocked on Flouci test keys (runbook ready).
- `npx prisma db push` must run against the real DATABASE_URL at deploy (local `.env` has none) to create PaymentEvent indexes.
- 16 npm audit vulns (mostly xlsx chain) → Phase E.

**Verification:** `npm test` 16/16 green · `npm run build` green (28 routes, standalone copy OK).
