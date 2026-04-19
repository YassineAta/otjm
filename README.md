<div align="center">

<img src="public/otjm-logo.png" alt="OTJM Logo" width="120" />

# OTJM — Organisation Tunisienne des Jeunes Médecins

**Plateforme officielle de gestion des membres, des actualités et des archives**

[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-green?style=flat-square&logo=mongodb)](https://www.mongodb.com/)
[![Prisma](https://img.shields.io/badge/Prisma-6-2D3748?style=flat-square&logo=prisma)](https://www.prisma.io/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38BDF8?style=flat-square&logo=tailwindcss)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/Licence-MIT-orange?style=flat-square)](LICENSE)

</div>

---

## 📋 Présentation

**OTJM** est une application web full-stack développée pour l'Organisation Tunisienne des Jeunes Médecins. Elle regroupe :

- Un **site public** accessible aux visiteurs : actualités, adhésion, archives
- Un **tableau de bord administrateur** sécurisé pour la gestion de l'organisation
- Un support **bilingue Français / Arabe** avec gestion RTL

> L'objectif est de centraliser la communication de l'organisation, simplifier la gestion des membres et faciliter l'accès à l'information médicale en Tunisie.

---

## ✨ Fonctionnalités principales

### 🌐 Site public
- Page d'accueil avec fil d'actualités animé
- Section **Actualités** avec catégories (protestations, communiqués, annonces, mises à jour)
- Page **Adhésion** avec tarification par niveau (Étudiant / Résident)
- **Archives** de documents historiques
- Formulaire de contact + abonnement newsletter
- Interface entièrement responsive, mode sombre/clair

### 🔐 Espace administrateur
- Tableau de bord centralisé avec statistiques
- Gestion des **membres** (CRUD, import Excel en masse)
- Gestion des **actualités** et **archives**
- Gestion des **comptes administrateurs**
- Suivi des soumissions de contact

---

## 🛠️ Stack technique

| Catégorie | Technologies |
|-----------|-------------|
| Framework | Next.js 15 (App Router) + React 19 |
| Langage | TypeScript 5 (strict) |
| Styling | Tailwind CSS 4 + shadcn/ui |
| Animations | Framer Motion 12 |
| Base de données | MongoDB Atlas via Prisma ORM v6 |
| Auth | NextAuth.js v4 (Credentials) |
| Formulaires | React Hook Form + Zod |
| i18n | next-intl 4 (FR / AR) |
| Tableaux | TanStack Table |
| Graphiques | Recharts |
| Drag & Drop | DND Kit |
| HTTP Client | Axios + TanStack Query |
| State | Zustand |
| Images | Sharp |
| Export | xlsx |

---

## 🚀 Démarrage rapide

### Prérequis

- Node.js ≥ 18
- npm ou yarn
- Un cluster MongoDB Atlas (gratuit)

### Installation

```bash
# 1. Cloner le dépôt
git clone https://github.com/FieryAAA/otjm.git
cd otjm

# 2. Installer les dépendances
npm install

# 3. Configurer les variables d'environnement
cp .env.example .env.local
# Remplir les valeurs dans .env.local

# 4. Synchroniser le schéma Prisma
npm run db:push

# 5. Générer le client Prisma
npm run db:generate

# 6. (Optionnel) Créer un admin
node createAdmin.js

# 7. Lancer le serveur de développement
npm run dev
```

Ouvrir [http://localhost:3000](http://localhost:3000)

---

## ⚙️ Variables d'environnement

Copier `.env.example` en `.env.local` et renseigner les valeurs suivantes :

```env
# Base de données
DATABASE_URL="mongodb+srv://<user>:<password>@cluster.mongodb.net/otjm"

# NextAuth
NEXTAUTH_SECRET="une-clé-secrète-longue-et-aléatoire"
NEXTAUTH_URL="http://localhost:3000"

# Slug secret pour l'accès admin (ex: /mon-slug-secret)
ADMIN_SLUG="votre-slug-secret"
```

---

## 📁 Structure du projet

```
otjm/
├── src/
│   ├── app/
│   │   ├── (pages publiques)       # Homepage, news, membership, archives
│   │   ├── admin/                  # Dashboard admin (protégé)
│   │   └── api/                    # Routes API REST
│   ├── components/
│   │   ├── ui/                     # Composants shadcn/ui
│   │   └── otjm/                   # Composants spécifiques OTJM
│   ├── lib/
│   │   ├── i18n.tsx                # Contexte FR/AR
│   │   ├── db.ts                   # Client Prisma
│   │   ├── auth.ts                 # Utilitaires auth
│   │   ├── constants.ts            # Catégories et constantes
│   │   ├── animations.ts           # Variants Framer Motion
│   │   └── rate-limit.ts           # Rate limiting API
│   └── middleware.ts               # Protection des routes admin
├── prisma/
│   ├── schema.prisma               # Schéma base de données
│   └── seed.ts                     # Données de test
├── public/                         # Assets statiques
├── .env.example                    # Template variables d'environnement
└── createAdmin.js                  # Script création admin
```

---

## 🗄️ Schéma de base de données

```
User        → Auteurs et utilisateurs
Admin       → Comptes administrateurs (rôles, mdp hashé)
Membership  → Membres (email, niveau, statut, CIN, téléphone)
News        → Articles d'actualité (titre, contenu, catégorie)
Archive     → Documents historiques
Contact     → Soumissions formulaire de contact
Newsletter  → Abonnés email
```

---

## 🔒 Sécurité

- **Slug admin secret** — l'URL d'accès admin est masquée via variable d'environnement
- **Hachage des mots de passe** avec bcryptjs
- **Rate limiting** sur les APIs publiques
- **Headers de sécurité** : CSP, HSTS, X-Frame-Options, etc.
- **Validation Zod** sur toutes les entrées
- **TypeScript strict** end-to-end

---

## 📜 Scripts disponibles

```bash
npm run dev          # Serveur de développement (port 3000)
npm run build        # Build de production
npm run start        # Démarrer le serveur de production
npm run lint         # Vérification ESLint
npm run db:push      # Synchroniser le schéma Prisma → MongoDB
npm run db:generate  # Régénérer le client Prisma
npm run db:studio    # Ouvrir Prisma Studio (UI base de données)
npm run db:seed      # Injecter des données de test
```

---

## 🤝 Contribuer

Les contributions sont les bienvenues. Pour contribuer :

1. Forker le dépôt
2. Créer une branche feature (`git checkout -b feature/ma-fonctionnalite`)
3. Commiter les changements (`git commit -m "feat: ajouter X"`)
4. Pusher la branche (`git push origin feature/ma-fonctionnalite`)
5. Ouvrir une Pull Request

---

## 📄 Licence

Ce projet est sous licence **MIT**. Voir le fichier [LICENSE](LICENSE) pour plus de détails.

---

<div align="center">

Développé pour l'**OTJM** — Organisation Tunisienne des Jeunes Médecins 🇹🇳

</div>
