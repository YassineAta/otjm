# PERFORMANCE_AUDIT.md

> **What is this?** Performance findings from the 2026-06-12 static audit (commit `675fabc`), with the measurements we have now and the harness for before/after numbers once fixes land. No fix in this repo gets claimed as "faster" without a number in the _Measurements_ section below.

## TL;DR

The dominant problem is architectural, not micro: **every public page is a client component that fetches its data after hydration**. The server sends an empty shell, the browser downloads the JS bundle (including framer-motion everywhere), hydrates, _then_ calls `/api/news` etc. That is a classic double waterfall and it hurts LCP, TTI and SEO simultaneously. Everything else (images, caching headers) is secondary but cheap to fix.

## Findings (ranked by expected impact)

### P1 — Public pages are fully client-rendered with fetch-on-mount waterfalls — **High**

- `src/app/page.tsx` (863 lines), `news/page.tsx` (344), `archives/page.tsx` (354), `membership/page.tsx` (356) are all `'use client'` top to bottom.
- Data flow today: HTML shell → JS download → hydrate → `useEffect` → `fetch('/api/news')` → render. Four sequential network/CPU phases before content.
- Server components fetching via Prisma directly would deliver content in the first HTML byte stream and shrink the client bundle.
- _Constraint discovered:_ the custom i18n is a client-side React context (`src/lib/i18n.tsx`), so text content can't trivially move server-side without i18n rework. The pragmatic first step: keep text client-side, but move _data_ (news, archives) to server components / server-side props passed down, and split the monolith pages into server shells + small client islands.

### P2 — No next/image, no modern formats — **High**

- All images are plain `<img>`; `next/image` is unused despite `sharp` being installed (it's the optimizer's native backend!).
- `public/` inventory: `otjmlogo.jpg` **215 KB** (used repeatedly incl. as default content image), `otjm.jpg` **174 KB**, `otjmphoto.jpg` **56 KB**. As AVIF/WebP via next/image these are ~15–40 KB each at rendered sizes.
- Hero image: no `priority`/preload → late LCP.

### P3 — Zero caching on public content APIs — **Med-High**

- `/api/news` is `force-dynamic`; `/api/archives` has no directive — every visitor pays a MongoDB Atlas roundtrip for content that changes a few times per week.
- Fix: ISR-style caching (`revalidate`) once pages are server components, or `Cache-Control: s-maxage` on the API responses in the interim. News: 1h. Archives: 24h.

### P4 — framer-motion in every public page bundle — **Medium**

- ~12 KB gzip + hydration cost on all routes, used mostly for fade-up entrances. `src/lib/animations.ts` centralizes variants (good) but consider CSS-only entrance animations or `LazyMotion`/`m.` components to cut the runtime.

### P5 — Bulk import: N sequential Prisma creates — **Medium (admin-only)**

- `bulk-import/route.ts` does `Promise.all(rows.map(create))` → N roundtrips, no transaction. `createMany()` is one roundtrip. (Also listed as security S-low for partial-failure.)

### P6 — Middleware matcher too broad — **Low**

- `src/middleware.ts:48` matcher excludes only `_next/static`, `_next/image`, favicon and a few image extensions; it still runs (with a JWT parse for API paths) on every page navigation. Fine at this scale; tighten matcher when convenient.

### Non-issues (verified healthy)

- Fonts: `next/font` migration done (commit `607e3a1`), no external font links remain.
- Prisma client: proper dev-global singleton in `src/lib/db.ts`.
- `output: 'standalone'` + static copy in build script: correct for VPS deploys.
- No `xlsx`/`recharts` in public-page bundles (admin-side only / vendored-unused respectively).

## Bundle dead weight (from dependency audit)

| Package                  | Status                                                 | Action                           |
| ------------------------ | ------------------------------------------------------ | -------------------------------- |
| `@dnd-kit/*` (3 pkgs)    | zero imports                                           | remove                           |
| `react-resizable-panels` | zero imports (vendored `resizable.tsx` unused)         | remove                           |
| `next-intl`              | zero imports (custom i18n used instead)                | remove                           |
| `zustand`                | zero imports                                           | remove                           |
| `nodemon`                | dev dep, unused with `next dev`                        | remove                           |
| `recharts`, `input-otp`  | only inside vendored shadcn components, never rendered | keep or prune with the component |

These don't ship to the client today (tree-shaken / unimported) — removing them is hygiene + install-time win, not a bundle win. The bundle wins come from P1/P4.

## Measurement harness (to fill in before/after)

Commands (run on production build, not dev):

```powershell
rtk npm run build          # capture route-size table Next prints
npx next start             # then Lighthouse against http://localhost:3000
```

| Metric                                         | Baseline (pre-fix)                           | After P1 | After P2/P3 | Target                    |
| ---------------------------------------------- | -------------------------------------------- | -------- | ----------- | ------------------------- |
| `/` First Load JS                              | 183 kB (route 11.7 kB) — captured 2026-06-12 |          |             | < 130 kB                  |
| `/` LCP (local Lighthouse, mobile)             |                                              |          |             | < 2.5 s                   |
| `/news` content visible without JS (curl test) | ❌ empty shell                               |          |             | ✅ HTML contains articles |
| `otjmlogo.jpg` transferred size                | 215 KB                                       |          |             | < 40 KB                   |
| `/api/news` p50 (cached)                       | uncached DB hit                              |          |             | < 50 ms edge/ISR hit      |

> Baseline numbers will be captured as the first step of the implementation phase (build currently requires `DATABASE_URL` for `prisma generate`; we'll capture on the dev machine with the real env).
