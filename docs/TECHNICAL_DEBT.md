# TECHNICAL_DEBT.md

> **What is this?** The honest inventory of duplication, dead code, inconsistencies and design debt — with measured line counts from the 2026-06-12 audit. Each item says what it costs and what retiring it buys. Security items live in `SECURITY_REVIEW.md`; this file covers maintainability.

## The headline number

**≈ 800 lines of measurable duplication**, concentrated in the 5 admin pages (3,022 lines total), plus **6 dead dependencies** and **2 parallel toast systems**. The admin panel was clearly built by copy-pasting one CRUD page four times — every future admin feature currently costs ~600 lines instead of ~150.

## D1 — Admin CRUD copy-paste (the big one)

| Page | Lines |
|---|---|
| `admin/members/page.tsx` | 882 |
| `admin/news/page.tsx` | 634 |
| `admin/archives/page.tsx` | 619 |
| `admin/users/page.tsx` | 594 |
| `admin/dashboard/page.tsx` | 293 |

Four patterns repeat almost verbatim across members/news/archives/users:

| Pattern | Shape | Cost |
|---|---|---|
| Modal state (add/edit/view + selected + reset) | ~18 lines × 4 | ~72 |
| fetch + loading + error-toast + finally | ~25 lines × 4 | ~100 |
| search + filter recompute | ~22 lines × 4 | ~88 |
| CRUD handlers (create/update/delete per page) | ~18 lines × 12 | ~240 |
| 35 inline toast calls, no shared templates | scattered | ~70 |

**Retirement plan:** three hooks — `useCrudApi(endpoint)`, `useModalForm(initial)`, `useTableFilter(items, keys)` — extracted from the *members* page first (largest, most complete), then rolled to the other three. Expected: each page drops to ~300–350 lines, new admin pages become composition instead of copying.

## D2 — Dual price/tier systems (correctness debt, not just style)

- `TIER_PRICING` in `src/lib/flouci.ts`: `externe: 10, interne: 20` — drives real payments.
- `PRICE_MAP` in `admin/members/page.tsx:50-56`: `Externe/Interne/Resident/En instance de thèse` — drives admin entry.
- PATCH whitelist in `api/membership/[id]/route.ts:19`: `['student','young-doctor']` — matches *neither*.

Consequence: an admin cannot edit the tier of a membership created through the public flow. **Fix:** one `MEMBERSHIP_TIERS` constant in `src/lib/constants.ts` (label FR/AR, price, slug), imported by all three call sites + the signup modal.

## D3 — Dead code & dead dependencies

| Item | Evidence | Action |
|---|---|---|
| `components/ui/toast.tsx`, `toaster.tsx`, `hooks/use-toast.ts` | shadcn toast system, zero imports — sonner is the live system | delete |
| `@dnd-kit/core` + `sortable` + `utilities` | zero imports | uninstall |
| `react-resizable-panels` (+ `components/ui/resizable.tsx`) | zero imports | uninstall + delete |
| `next-intl` | zero imports (custom `lib/i18n.tsx` is the real system) | uninstall |
| `zustand` | zero imports | uninstall |
| `nodemon` | unused with `next dev` | uninstall (dev) |
| `createAdmin.js` (repo root) | duplicates `/api/setup`+`/setup` page; references the same Admin model | delete after confirming `/setup` works |
| `src/app/api/route.ts` | root API stub | delete if it's a placeholder |
| `LangSync.tsx` | duplicates the lang/dir effect already in `LanguageProvider` | delete after verifying no hydration regression |

## D4 — API layer inconsistencies

- **84 `NextResponse.json` calls** with two competing error shapes: `{ error }` (78) vs `{ message }` (6, in membership/payment). Clients can't normalize. → `src/lib/api.ts` with `apiError/apiSuccess` helpers.
- **Validation is hand-rolled per route** (or absent); `zod@4` is installed and *unused*. → shared schemas in `src/lib/schemas.ts`, `safeParse` at every POST/PATCH boundary. This also closes several security findings (S2 mass-assignment, archive PATCH limits).
- **`requireAdmin()` exists but isn't called by every protected route** — routes lean on middleware (single point of failure; see SECURITY S1/S2).

## D5 — Type safety

- 34 `any` usages in app code (acceptable in raw-JSON parsing, fixable elsewhere — dashboard maps, update objects).
- No shared domain types: `Member`, `NewsItem`, `ArchiveItem` interfaces are re-declared inline in admin pages and differ slightly from the API's actual shapes. → `src/types/domain.ts` as single source of truth.

## D6 — Monolith files

- `src/app/page.tsx` (863) — homepage hero + news + pricing + newsletter in one client component. Split into sections under `components/otjm/home/`.
- `src/lib/i18n.tsx` (461) — provider + both dictionaries. Split dictionaries to `src/locales/fr.ts` / `ar.ts`; provider shrinks to ~80 lines.

## D7 — Misc paper cuts

- `DEFAULT_IMAGE_URL` defined twice with different values: `'/otjmlogo.jpg'` (news) vs `'otjmlogo.jpg'` (archives — missing slash, likely a broken relative URL on nested routes).
- Hardcoded FR strings in contact/newsletter forms bypass i18n.
- Success page promises an email ("Vous recevrez votre carte membre par email") that the system cannot send — no email subsystem exists. This is a *product* debt until the card generator ships.
- `package.json` `name` is still `nextjs_tailwind_shadcn_ts` (template leftover).

## Debt burn-down order

1. **D3 deletions** (zero-risk, immediate clarity win) — do first, in one commit, verifiable by `rtk next build`.
2. **D2 tier unification** (small, fixes a real admin bug, prerequisite for card generator's tier labels).
3. **D4 api helpers + zod schemas** (enables safe middleware fix rollout; pairs with security work).
4. **D1 admin hook extraction** (biggest payoff, medium risk — one page at a time, build green between each).
5. **D6 splits** (homepage split rides along with the performance server-component work; i18n split is mechanical).

## What we deliberately do NOT do now

- No state-management library, no React Query: the extracted `useCrudApi` hook is sufficient at this scale.
- No admin-layout mega-abstraction: pages differ enough that forcing one layout component would add coupling, not remove it.
- No Laravel migration in this pass: `FIX.md` documents that strategic option; these fixes keep the running Next.js system healthy regardless.
