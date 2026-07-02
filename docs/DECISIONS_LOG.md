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

## ADR-007 — Stockage des fichiers : Cloudflare R2, téléversement présigné (2026-07-02)

**Contexte :** Les admins doivent pouvoir téléverser les documents d'archives (images + PDF) au lieu de coller des URLs externes. Aucun stockage n'existait. Contrainte de pérennité : le site appartient à l'association et survivra au stage — pas de crédits étudiants (GitHub Education : DigitalOcean/Azure expirent avec le statut), compte au nom de l'association.
**Décision :** Cloudflare R2 — 10 Go gratuits permanents, bande passante sortante gratuite, API S3 standard (compétence transférable). Téléversement **présigné** : le serveur vérifie session admin + type/taille puis signe une URL PUT (5 min) ; les octets vont navigateur → R2 directement, hors de la limite de corps de requête serverless de Vercel.
**Alternatives :** (a) Vercel Blob — zéro compte supplémentaire mais ~1 Go gratuit et SDK propriétaire ; (b) crédits GitHub Education — rejetés : expirent, liés à un compte personnel ; (c) statu quo URL-externe — ne répond pas au besoin.
**Conséquences :** 5 variables d'env `R2_*` (voir `docs/CONFIGURATION_R2.md`), CORS à configurer sur le bucket, CSP `connect-src` élargie à `*.r2.cloudflarestorage.com`. Dégradation propre : sans configuration R2, l'API répond 503 explicite et le collage d'URL reste possible. Interdit d'y stocker des données personnelles (bucket public). Migration future = recopier les objets + changer `R2_PUBLIC_BASE_URL` (les URLs sont de simples chaînes en base).

## ADR-008 — Limitation de débit : Upstash Redis (2026-07-02, implémentation en phase sécurité)

**Contexte :** Login, réinitialisation de mot de passe et webhook de paiement sont exposés sans limite d'essais (brute force possible) sur un site en production portant des PII.
**Décision :** `@upstash/ratelimit` + Upstash Redis (via Vercel Marketplace, palier gratuit permanent) : compteurs partagés entre toutes les instances serverless — seule option réellement efficace sur Vercel.
**Alternatives :** (a) limiteur en mémoire — rejeté : chaque instance serverless a sa propre mémoire, les compteurs se réinitialisent à froid, protection cosmétique ; (b) WAF Cloudflare — exigerait de déplacer le DNS/proxy hors OVH ; (c) reporter — inacceptable en production.
**Conséquences :** Un compte Upstash à créer (au nom de l'association), 2 variables d'env, quelques ms de latence sur les routes protégées.

## ADR-009 — Paiement : sélecteur multi-méthodes Flouci + ClicToPay (2026-07-02, structure préparée avant réception des accès)

**Contexte :** Précision fonctionnelle : ClicToPay et Flouci ne sont pas exclusifs — le membre choisira sa méthode au moment de payer (« Paiement par carte » = ClicToPay, portefeuille = Flouci), à la manière du sélecteur de ba9chich.com/fr/topup. L'affiliation ClicToPay passe par la banque de l'association (SMT) et n'est pas encore obtenue. Amende ADR-002 (« Flouci as sole payment gateway ») : Flouci reste la seule méthode _active_ jusqu'à réception des accès.
**Décision :** Extraire une interface `PaymentProvider` autour du code Flouci existant (sans changement de comportement — la machine à états et le pattern verify-don't-trust d'ADR-002 sont conservés) + squelette d'adaptateur ClicToPay. À la réception des identifiants bancaires : remplir l'adaptateur, ajouter les variables d'env, activer l'option dans le sélecteur — sans refonte.
**À demander à la banque :** affiliation e-commerce ClicToPay, identifiants API marchand, et **accès à l'environnement de test** (indispensable pour valider avant mise en production).
**Conséquences :** Le sélecteur de méthode est une décision UI à concevoir dans le tunnel d'adhésion ; chaque méthode garde sa propre vérification serveur du montant ; les événements de paiement tracent la méthode utilisée.

## ADR-010 — Comptes admin : provisionnement temporaire par mot de passe généré (2026-07-02)

**Contexte :** Un seul compte pouvait se connecter (créé par `/api/setup`, qui se verrouille après le premier admin) ; la page « Utilisateurs » ne crée que des auteurs de contenu sans mot de passe. Or plusieurs membres du bureau doivent téléverser des archives dès maintenant. La solution cible (invitation par code email, cf. phase d'authentification : OTP email pour 2FA + réinitialisation + invitations) dépend d'un SMTP fiable en production, pas encore garanti.
**Décision :** Page « Comptes administrateurs » réservée au superadmin (`requireSuperAdmin()`, défense en profondeur derrière le middleware) : création d'un compte `role: 'admin'` avec mot de passe fort **généré côté serveur** (~86 bits, alphabet sans caractères ambigus), affiché **une seule fois** au superadmin qui le transmet par canal privé. Jamais stocké en clair. Suppression possible (révocation), avec gardes : ni son propre compte, ni un superadmin.
**Alternatives :** (a) script local contre Atlas — invisible pour l'association, aucune trace UI, pas de révocation simple ; (b) attendre la phase invitation-email — bloque le bureau plusieurs jours/semaines ; (c) laisser les admins choisir leur mot de passe à la création — plus faible qu'un mot de passe aléatoire fort, et sans flux « première connexion » sécurisé.
**Migration :** la phase auth remplace la remise en main propre par l'invitation par email + changement de mot de passe obligatoire à la première connexion ; les lignes `Admin` créées ici restent inchangées — rien à reprendre.
**Conséquences :** Le mot de passe temporaire reste valable tant que la phase auth (changement de mot de passe, 2FA) n'est pas livrée — trade-off accepté et tracé ; le canal de transmission (appel, message direct) est la surface de risque résiduelle.
