# OTJM — Plateforme web

Application full-stack pour l'Organisation Tunisienne des Jeunes Médecins. Inclut un site public (actualités, adhésion, archives) et un tableau de bord administrateur sécurisé. Bilingue français/arabe.

---

## Stack

| Couche | Technologie |
|---|---|
| Framework | Next.js 15 (App Router) + React 19 |
| Langage | TypeScript 5 strict |
| Base de données | MongoDB Atlas via Prisma ORM v6 |
| Authentification | NextAuth.js v4 (credentials) |
| Styling | Tailwind CSS 4 + shadcn/ui (Radix) |
| Animations | Framer Motion 12 |
| Formulaires | React Hook Form + Zod |
| Internationalisation | next-intl 4 (FR/AR) |
| Tableaux | TanStack Table |
| État global | Zustand |
| HTTP client | Axios |
| Export/Import | xlsx |
| Images | Sharp |
| Build | Next.js standalone output |

---

## Prérequis

- Node.js >= 18
- Un cluster MongoDB Atlas (tier gratuit suffisant)
- `npm` ou `yarn`

---

## Installation

```bash
git clone https://github.com/FieryAAA/otjm.git
cd otjm
npm install
cp .env.example .env.local
# remplir .env.local
npm run db:generate
npm run db:push
npm run dev
```

---

## Variables d'environnement

Toutes les variables sont requises en production.

| Variable | Description |
|---|---|
| `DATABASE_URL` | URI MongoDB Atlas : `mongodb+srv://user:pass@cluster.mongodb.net/otjm` |
| `NEXTAUTH_SECRET` | Clé secrète NextAuth. Générer : `openssl rand -base64 32` |
| `NEXTAUTH_URL` | URL de base de l'application. Ex : `https://otjm.tn` |
| `ADMIN_SLUG` | Segment d'URL secret pour accéder au panel admin. Ex : `a3f9b2`. Générer : `node -e "console.log(require('crypto').randomBytes(6).toString('hex'))"` |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS` / `MAIL_FROM` | Coordonnées SMTP pour l'envoi de la carte de membre par email (voir `docs/CARD_GENERATOR.md`) |
| `DEV_AUTH_BYPASS` | Dev uniquement : `1` pour désactiver l'auth admin en local (ignoré hors `NODE_ENV=development`) |

---

## Scripts

```bash
npm run dev          # Serveur de développement, port 3000
npm run build        # Build de production (standalone + copie des assets)
npm run start        # Démarrer le serveur de production
npm run lint         # ESLint

npm run db:push      # Pousser le schéma Prisma vers MongoDB
npm run db:generate  # Régénérer le client Prisma (après modification du schéma)
npm run db:studio    # Ouvrir Prisma Studio (GUI base de données)
npm run db:seed      # Injecter les données de test (tsx prisma/seed.ts)
```

Le script `build` copie également `public/` et `.next/static/` dans `.next/standalone/` pour que le serveur standalone soit autonome.

---

## Créer le premier compte admin

Ouvrir `/setup` dans le navigateur (formulaire de création du premier compte). L'endpoint `POST /api/setup` se verrouille automatiquement dès qu'un admin existe et est rate-limité. L'ancien script `createAdmin.js` a été supprimé (mécanisme en double).

---

## Structure du projet

```
otjm/
├── prisma/
│   ├── schema.prisma         # Schéma de la base de données
│   └── seed.ts               # Données de test
├── public/                   # Assets statiques (images, logo, robots.txt)
├── src/
│   ├── app/
│   │   ├── page.tsx          # Page d'accueil (hero, actualités, adhésion, newsletter)
│   │   ├── news/page.tsx     # Liste des actualités publiques
│   │   ├── archives/page.tsx # Archives avec filtres (catégorie, année, recherche)
│   │   ├── membership/page.tsx  # Tarifs, étapes, FAQ, formulaire d'adhésion
│   │   ├── layout.tsx        # Root layout (providers, polices, métadonnées)
│   │   ├── globals.css       # Styles globaux Tailwind
│   │   ├── error.tsx         # Error boundary global
│   │   ├── admin/            # Section admin (protégée, voir ci-dessous)
│   │   └── api/              # Routes API (voir section API)
│   ├── components/
│   │   ├── ui/               # Composants shadcn/ui (générés, ne pas modifier manuellement)
│   │   ├── auth/
│   │   │   └── AdminGuard.tsx   # HOC de protection des pages admin côté client
│   │   └── otjm/
│   │       ├── SiteHeader.tsx   # Header global avec nav, toggles langue/thème
│   │       └── SiteFooter.tsx   # Footer global
│   ├── hooks/
│   │   ├── use-mobile.ts     # Détection breakpoint mobile
│   │   └── use-toast.ts      # Hook toast (Sonner)
│   ├── lib/
│   │   ├── i18n.tsx          # Contexte React FR/AR, hook useLanguage()
│   │   ├── db.ts             # Singleton Prisma Client
│   │   ├── auth.ts           # requireAdmin(), isValidEmail(), sanitize(), constantes
│   │   ├── constants.ts      # CATEGORIES, NAV, MEMBERSHIP_STEPS, MEMBERSHIP_TIERS
│   │   ├── animations.ts     # Variants Framer Motion réutilisables
│   │   ├── rate-limit.ts     # Rate limiter in-memory pour les routes publiques
│   │   └── utils.ts          # cn() (clsx + tailwind-merge) et utilitaires divers
│   └── middleware.ts         # Routage admin secret + protection des routes
├── types/
│   └── next-auth.d.ts        # Augmentation des types de session NextAuth
├── .env.example              # Template des variables d'environnement
├── next.config.ts            # Config Next.js (standalone, headers de sécurité, CSP)
├── tailwind.config.ts        # Configuration Tailwind
├── components.json           # Configuration shadcn/ui
└── tsconfig.json             # Configuration TypeScript strict
```

---

## Base de données

### Modèles Prisma

#### User
Auteurs d'articles. Distinct de `Admin` (qui gère l'accès au dashboard).

| Champ | Type | Notes |
|---|---|---|
| id | String | ObjectId |
| email | String | unique |
| name | String? | — |
| role | String | défaut : "member" |
| createdAt | DateTime | — |
| updatedAt | DateTime | — |

Relations : `news News[]`, `archives Archive[]`

#### Admin
Comptes d'accès au dashboard. Authentifiés via NextAuth credentials.

| Champ | Type | Notes |
|---|---|---|
| id | String | ObjectId |
| email | String | unique |
| hashedPassword | String | bcrypt 12 rounds |
| name | String? | — |
| role | String | "admin" ou "superadmin", défaut "superadmin" |

#### Membership
Enregistrements d'adhésion soumis via le formulaire public ou importés.

| Champ | Type | Notes |
|---|---|---|
| id | String | ObjectId |
| name | String | défaut : "" |
| email | String | unique |
| tier | String | "student" ou "young-doctor" |
| status | String | "active", "pending", "cancelled" |
| paymentMethod | String | — |
| paymentStatus | String | "paid", "pending", "failed" |
| startDate | DateTime | — |
| endDate | DateTime | — |
| price | Float | en DT |
| memberStatus | String? | statut exact transmis par le formulaire |
| faculty | String? | — |
| cin | String? | — |
| phone | String? | — |
| dateOfBirth | DateTime? | — |

#### News
Articles d'actualité. Publiés ou en brouillon.

| Champ | Type | Notes |
|---|---|---|
| id | String | ObjectId |
| title | String | — |
| excerpt | String? | — |
| content | String? | — |
| category | String? | clé de `CATEGORIES` |
| imageUrl | String? | — |
| sourceUrl | String? | — |
| published | Boolean | défaut : false |
| authorId | String? | ObjectId → User |
| createdAt | DateTime | — |

#### Archive
Documents historiques (rapports, déclarations, chartes…).

| Champ | Type | Notes |
|---|---|---|
| id | String | ObjectId |
| title | String | — |
| excerpt | String | — |
| content | String | — |
| category | String | — |
| documentType | String | Rapport, Déclaration, Charte, Communiqué, Autre |
| imageUrl | String? | — |
| linkUrl | String? | — |
| date | DateTime | défaut : now() |
| authorId | String | ObjectId → User (requis) |

#### Contact
Soumissions du formulaire de contact.

| Champ | Type | Notes |
|---|---|---|
| id | String | ObjectId |
| name | String | — |
| email | String | — |
| subject | String | max 256 chars |
| message | String | max 5000 chars |
| status | String | "unread" par défaut |

#### Newsletter
Abonnements email.

| Champ | Type | Notes |
|---|---|---|
| id | String | ObjectId |
| email | String | unique |
| active | Boolean | défaut : true — réactivé si l'email se réabonne |

---

## Authentification et accès admin

### Accès au panel

L'URL de connexion admin n'est **pas** `/admin`. Elle utilise un slug secret défini dans `ADMIN_SLUG`. Le middleware redirige `/{ADMIN_SLUG}/*` vers `/admin/*` côté serveur. L'URL réelle n'est jamais exposée au client.

Pour accéder au panel : `https://votre-domaine.com/{ADMIN_SLUG}`

### Middleware (`src/middleware.ts`)

- En développement : toutes les requêtes passent sans vérification.
- Routes `/{ADMIN_SLUG}/*` : réécrites silencieusement vers `/admin/*`.
- Routes `/admin/*` : session requise avec rôle `admin` ou `superadmin`. Retourne 404 (pas 401) pour ne pas révéler l'existence du panel.
- Routes API publiques (`/api/auth`, `/api/contact`, `/api/newsletter`, `/api/news`, `/api/archives`) : accessibles sans session.
- Autres routes `/api/*` : session admin requise, retourne 401.

**Matcher** : toutes les routes sauf `_next/static`, `_next/image`, `favicon.ico` et les assets image.

### `requireAdmin()` (`src/lib/auth.ts`)

Utilisé dans chaque route API protégée. En développement, retourne une session fictive `{ id: 'dev', role: 'superadmin', email: 'dev@localhost' }`. En production, vérifie la session NextAuth et le rôle.

```ts
const auth = await requireAdmin();
if ('error' in auth) return auth.error; // NextResponse 401/403
const { session } = auth;
```

### Rôles

| Rôle | Accès |
|---|---|
| `superadmin` | Accès complet |
| `admin` | Accès complet au dashboard |
| `member` | Pas d'accès admin (réservé aux `User`, pas aux `Admin`) |

---

## Routes API

Toutes les routes se trouvent dans `src/app/api/`. Les routes marquées **[admin]** nécessitent une session avec rôle `admin` ou `superadmin`.

### Actualités

| Méthode | Route | Auth | Description |
|---|---|---|---|
| GET | `/api/news` | public | Liste les articles. `?published=true` pour filtrer. |
| POST | `/api/news` | [admin] | Crée un article. Requis : `title`, `authorId`. |
| PATCH | `/api/news/[id]` | [admin] | Met à jour un article. Tous les champs sont optionnels. |
| DELETE | `/api/news/[id]` | [admin] | Supprime un article. Retourne 204. |

### Archives

| Méthode | Route | Auth | Description |
|---|---|---|---|
| GET | `/api/archives` | public | Liste toutes les archives, triées par date desc. |
| GET | `/api/archives/[id]` | public | Retourne une archive par ID. |
| POST | `/api/archives` | [admin] | Crée une archive. Requis : `title`, `excerpt`, `content`, `category`, `documentType`, `authorId`. |
| PATCH | `/api/archives/[id]` | [admin] | Met à jour une archive. |
| DELETE | `/api/archives/[id]` | [admin] | Supprime une archive. |

### Adhésion

| Méthode | Route | Auth | Description |
|---|---|---|---|
| GET | `/api/membership` | [admin] | Liste les membres. `?email=value` pour filtrer. |
| POST | `/api/membership` | public (rate-limited) | Crée une adhésion. Requis : `fullName`, `email`, `memberStatus`, `price`, `startDate`, `endDate`. Retourne 409 si l'email existe déjà. |
| PATCH | `/api/membership/[id]` | [admin] | Met à jour statut, paymentStatus, tier, memberStatus, price. Champs validés individuellement. |
| DELETE | `/api/membership/[id]` | [admin] | Supprime un membre. |
| POST | `/api/membership/bulk-import` | [admin] | Import Excel/CSV via `multipart/form-data` (champ `bulkFile`). Déduit `tier` et `price` depuis `memberStatus`. Ignore les emails déjà existants. |

**Logique de mapping import Excel :**
- `memberStatus` = Résident / Interne / En instance de thèse → `tier: young-doctor`, `price: 20`
- Autres → `tier: student`, `price: 10`
- `paymentStatus: paid` → `status: active`, sinon `status: pending`

### Contact

| Méthode | Route | Auth | Description |
|---|---|---|---|
| GET | `/api/contact` | [admin] | Liste les soumissions de contact. |
| POST | `/api/contact` | public (rate-limited) | Soumet un message. Requis : `name`, `email`, `subject`, `message`. Validation format email, longueurs max. |

### Newsletter

| Méthode | Route | Auth | Description |
|---|---|---|---|
| GET | `/api/newsletter` | [admin] | Liste les abonnés. |
| POST | `/api/newsletter` | public (rate-limited) | Abonne un email. Si déjà existant, réactive (`active: true`). |

### Utilisateurs admin

| Méthode | Route | Auth | Description |
|---|---|---|---|
| GET | `/api/admin/users` | [admin] | Liste les comptes admin. |
| POST | `/api/admin/users` | [admin] | Crée un compte admin. Requis : `email`, `name`, `role` (member ou admin). |
| GET | `/api/admin/users/[id]` | [admin] | Retourne un compte admin par ID. |
| PATCH | `/api/admin/users/[id]` | [admin] | Met à jour `name` et/ou `role`. |
| DELETE | `/api/admin/users/[id]` | [admin] | Supprime un compte admin. |
| POST | `/api/admin/users/[id]` (reset) | [admin] | Placeholder reset mot de passe. En production : implémenter l'envoi d'email. |

### Santé

| Méthode | Route | Auth | Description |
|---|---|---|---|
| GET | `/api` | public | Health check. Retourne `{ message: "Hello, world!" }`. |

### Rate limiting

Les routes publiques (`/api/contact`, `/api/newsletter`, `/api/membership`) sont limitées à **5 requêtes par IP par 60 secondes** via un rate-limiter in-memory (`src/lib/rate-limit.ts`). En environnement multi-process, remplacer par un store Redis.

---

## Internationalisation

Le système est basé sur un contexte React (`src/lib/i18n.tsx`), pas sur les fichiers de locale next-intl conventionnels.

- Langues : `fr` (défaut), `ar`
- Préférence stockée dans `localStorage` sous la clé `otjm-lang`
- `document.documentElement.lang` et `.dir` mis à jour en temps réel
- L'arabe passe en `dir="rtl"` automatiquement

**Utilisation dans un composant :**

```tsx
import { useLanguage } from '@/lib/i18n';

const { t, lang, setLang } = useLanguage();
// t.nav.home, t.news.title, etc.
```

L'objet `t` contient toutes les traductions : `nav`, `header`, `footer`, `categories`, `news`, `archives`, `membership`, `home`. Voir `src/lib/i18n.tsx` pour la structure complète.

---

## Constantes (`src/lib/constants.ts`)

### `CATEGORIES`

Objet indexé par clé. Utilisé pour les filtres et l'affichage des badges.

| Clé | Label | Couleur |
|---|---|---|
| `protests` | Protestation | red-400 |
| `statements` | Déclaration | blue-400 |
| `announcements` | Annonce | amber-400 |
| `updates` | Mise à jour | slate-400 |

### `NAV`

Tableau des liens de navigation : Accueil (`/`), Actualités (`/news`), Archives (`/archives`), Adhésion (`/membership`).

### `MEMBERSHIP_TIERS`

Deux niveaux : Externe (10 DT) et Interne/Résident (20 DT, marqué `isPopular`).

---

## Sécurité

- **URL admin masquée** via `ADMIN_SLUG` — le middleware redirige sans exposer `/admin` aux logs réseau.
- **Mots de passe** hachés avec bcrypt, 12 rounds.
- **Headers HTTP** : HSTS, X-Frame-Options DENY, X-Content-Type-Options nosniff, Referrer-Policy, Permissions-Policy (caméra/micro/géoloc désactivés).
- **CSP** : configurée dans `next.config.ts`. `frame-src` autorise uniquement `cha9a9a.tn` pour le paiement. `unsafe-eval` retiré en production.
- **Rate limiting** in-memory sur les routes publiques. À remplacer par Redis en multi-instance.
- **Validation Zod** sur toutes les entrées utilisateur, côté serveur.
- **TypeScript strict** end-to-end.

---

## Déploiement

Le build produit un serveur standalone dans `.next/standalone/server.js`.

```bash
npm run build
NODE_ENV=production node .next/standalone/server.js
```

Variables requises en production : toutes celles de `.env.example`.

Pour Docker ou PM2, pointer `node .next/standalone/server.js` comme point d'entrée. Le répertoire `public/` et `.next/static/` sont copiés dans `standalone/` par le script de build.
