# DECISIONS_LOG.md

> **What is this?** Architecture Decision Records (ADR-style, newest last). Each entry: context → decision → alternatives → consequences. If you're about to change something fundamental, check whether a decision here explains why it is the way it is.

## ADR-001 — Stay on Next.js for now; Laravel rewrite remains a separate strategic track (2026-06-12)

**Context:** `FIX.md` and the root `CLAUDE.md` document a planned Laravel/PostgreSQL/Filament rewrite (better fit for relational PII data, Tunisian market CV value). Meanwhile this Next.js app is the deployed product with a broken-in-prod payment flow and a promised-but-missing member card.
**Decision:** Fix and harden the Next.js system now. The rewrite, if it happens, inherits working business logic, a tested payment flow, and these docs as its spec.
**Alternatives:** (a) freeze Next.js and rewrite immediately — rejected: leaves payments broken for months and a beginner-Laravel timeline is risky; (b) hybrid — rejected: two prod systems, double ops.
**Consequences:** Some work (zod schemas, payment state machine, card generator) is transferable design; some (admin hooks) is Next.js-specific and accepted as sunk cost if the rewrite happens.

## ADR-002 — Flouci as sole payment gateway, verify-don't-trust pattern (inherited, ratified 2026-06-12)

**Context:** Commit `5165bfc` replaced Google Form + Cha9a9a with direct Flouci checkout. Flouci offers `generate_payment` → redirect → `verify_payment` with a developer tracking id.
**Decision:** Keep. Server-side `TIER_PRICING` is the only price authority; both return-redirect and webhook re-verify against Flouci's API with the secret key before mutating state; payment state transitions are monotonic (pending → paid|failed only).
**Consequences:** Webhook forgery is harmless (triggers a verify, not a state write), at the cost of one extra Flouci API call per callback. Residual gaps tracked: amount cross-check (S5), webhook rate limit (S4), CSP leftover for cha9a9a (S13).

## ADR-003 — Custom React-context i18n instead of next-intl (inherited, kept with conditions, 2026-06-12)

**Context:** `next-intl` is installed but unused; a 461-line custom provider with embedded FR/AR dictionaries is the live system. It's client-side only: server HTML is language-blind.
**Decision:** Keep the custom provider (it works, the team understands it, TS enforces FR/AR key parity), but split dictionaries into `src/locales/` and drop the `next-intl` dependency. Revisit only if SEO-in-Arabic becomes a requirement (would need cookie/URL-based locale for SSR).
**Alternatives:** migrate to next-intl with `[locale]` routing — rejected for now: large blast radius across every page for an SEO benefit not yet asked for.

## ADR-004 — Card generation: sharp + SVG overlay server-side, PNG primary artifact (2026-06-12, pending approval)

**Context:** Member card design exists as `cardhonneur.ai` (PDF-compatible, 12.4 MB, CR80-landscape composition). We need name/tier/ID/validity personalization, email delivery, mobile-friendly result. `sharp` is already a dependency.
**Decision (proposed):** One-time manual export of the .ai to a high-res flattened PNG background (print-quality, ~300 DPI). At runtime, compose `text as SVG → sharp.composite()` → personalized PNG. PDF variant (for print) generated from the same PNG via `pdf-lib` (pure-JS, tiny). Cards rendered on-demand at payment success, attached to the delivery email, not stored long-term (regenerable; avoids PII-bearing files at rest).
**Alternatives:** (a) stamp text directly onto the .ai-PDF with pdf-lib — keeps vectors but Arabic text shaping in raw PDF is painful (RTL + glyph shaping needs full font embedding and a shaping engine); (b) headless-browser HTML→PNG (playwright/puppeteer) — heavyweight dependency for a VPS, slow cold starts; (c) canvas (node-canvas) — native build pain on Windows/CI. **sharp+SVG wins**: already installed, librsvg handles Arabic shaping with the right font, fast, no new native deps.
**Consequences:** Need the exact fonts (or licensed substitutes) for the card text; need a personalization-zone spec agreed on the design (name placement). Print shops wanting true vector would need a separate path — out of scope.

## ADR-005 — Email: nodemailer + SMTP, provider-agnostic env config (2026-06-12, pending approval)

**Context:** No email capability exists; card delivery + payment confirmation need one. Budget ≈ 0; association likely has a mailbox (or can create one); Resend/Postmark free tiers require domain DNS control.
**Decision (proposed):** `nodemailer` over SMTP with all coordinates in env (`SMTP_HOST/PORT/USER/PASS/MAIL_FROM`). Works with Gmail app-passwords today and upgrades to Resend/Brevo SMTP later by changing env only — no code change. Send is fire-and-forget _after_ the payment state write, with failure logged to the events trail so admins can resend from the panel.
**Alternatives:** Resend SDK (nicer DX, but vendor-coupled + needs DNS); queueing system (overkill at this volume).
**Consequences:** Deliverability depends on the SMTP sender's reputation; acceptable for transactional volume (~tens/month). A `resend card` admin action covers transient failures without a queue.

## ADR-006 — Validation standard: zod at every API boundary (2026-06-12, pending approval)

**Context:** zod@4 installed, unused; every route hand-validates differently; mass-assignment found in membership POST.
**Decision (proposed):** Every POST/PATCH body passes a zod schema (`src/lib/schemas.ts`) before touching Prisma. Schemas double as the source for TS types (`z.infer`) — kills the inline-interface drift (D5).
**Consequences:** ~15 lines per route replaced by 2; uniform 400 error shape; the only place "what fields exist" is defined.
