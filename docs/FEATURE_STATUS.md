# FEATURE_STATUS.md

> **What is this?** Honest status of every user-facing capability. "Works" means verified in code review; nothing here is aspirational. Updated 2026-06-12 (audit, commit `675fabc`).

| Feature | Status | Notes |
|---|---|---|
| Public homepage (FR/AR, RTL, dark mode) | ✅ Works | Client-rendered monolith — perf rework planned, behavior fine |
| News listing + categories | ✅ Works | ⚠️ unpublished drafts leak via API (SECURITY S9) |
| Archives listing | ✅ Works | |
| Contact form | ✅ Works (stores to DB) | No notification/auto-reply email — admin must poll dashboard |
| Newsletter signup (RGPD consent) | ✅ Works (stores to DB) | No send capability exists |
| Privacy policy page | ✅ Works | |
| Membership signup form | ✅ Works in dev | |
| **Flouci payment (create → redirect → verify)** | 🔴 **Broken in production** | Middleware 401s `/api/payment/*` (S1). Logic itself is sound; never end-to-end tested (test keys not yet configured) |
| Payment webhook | 🔴 Same middleware block | Also lacks rate limit + amount check |
| Success/failed pages | ⚠️ Misleading copy | Success page promises card delivery by email — not implemented |
| **Member card generation** | ❌ Not built | Design exists (`cardhonneur.ai`); this audit includes the build plan |
| **Email delivery (any)** | ❌ Not built | No email library in the project at all |
| Admin login (hidden slug, bcrypt, JWT) | ✅ Works | Role-downgrade bug locks out non-superadmin admins (S7) |
| Admin dashboard stats | ✅ Works | |
| Admin members CRUD | ⚠️ Works with bug | Cannot edit tier of publicly-created memberships (D2 tier mismatch) |
| Admin bulk import (XLSX) | ⚠️ Works | xlsx CVE (S8), N-queries pattern, no transaction |
| Admin news/archives/users CRUD | ✅ Works | Heavy duplication (D1) |
| First-admin bootstrap (`/setup`) | ✅ Works | Self-locking; duplicate `createAdmin.js` to delete |
| i18n FR/AR + RTL | ✅ Works | Contact/newsletter labels FR-only |
| Audit logging | ❌ Not built | Planned with card/payment events |

## Pipeline (proposed, pending approval)

1. **P0:** Un-break production payments (middleware) + interlocked membership-route auth.
2. **P0:** Flouci test-mode end-to-end validation with test keys, amount check, webhook hardening.
3. **P1:** Card generator + email delivery (closes the success-page promise).
4. **P1:** Debt burn-down (dead code, tier unification, api helpers, admin hooks).
5. **P2:** Performance rework (server components, next/image, caching).
6. **P2:** PII encryption at rest.
