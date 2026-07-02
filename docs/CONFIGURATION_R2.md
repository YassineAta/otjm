# Configuration du stockage Cloudflare R2

> **Objectif** : permettre aux admins de téléverser les fichiers des archives
> (images de couverture + documents PDF) directement depuis le panneau
> d'administration, sans dépendre de liens externes.
>
> **Décision d'architecture** : voir `docs/DECISIONS_LOG.md` — ADR-007.

## Comment ça marche (résumé technique)

```
Admin (navigateur)                    Serveur Next.js                Cloudflare R2
      │  1. POST /api/admin/upload        │                              │
      │     (nom, type, taille) ─────────►│  vérifie session admin       │
      │                                   │  + type/taille du fichier    │
      │  2. ◄── { uploadUrl, publicUrl }  │  signe une URL PUT (5 min)   │
      │                                   │                              │
      │  3. PUT fichier ─────────────────────────────────────────────────►
      │  4. enregistre publicUrl dans le formulaire d'archive            │
```

Le fichier ne transite **jamais** par le serveur : pas de limite de taille
serverless, pas de coût de bande passante Vercel. R2 ne facture pas la
bande passante sortante (egress gratuit) ; le palier gratuit couvre 10 Go
de stockage.

## Étapes de mise en place (une seule fois)

### 1. Compte Cloudflare — au nom de l'association

Créer le compte avec une adresse de l'association (ex. `contact@otjm.org.tn`),
**pas** un compte personnel ni étudiant : l'infrastructure doit survivre aux
changements d'équipe. L'activation de R2 peut demander une carte bancaire ;
rien n'est facturé sous 10 Go de stockage.

### 2. Créer le bucket

Tableau de bord Cloudflare → **R2** → _Create bucket_ :

- Nom : `otjm-fichiers`
- Localisation : automatique (ou _Specify jurisdiction_ → UE si souhaité)

### 3. Accès public en lecture

Dans le bucket → **Settings** → _Public access_ :

- Pour démarrer : activer _r2.dev subdomain_ → noter l'URL
  (ex. `https://pub-xxxxxxxx.r2.dev`)
- En cible : _Custom domain_ → `fichiers.otjm.org.tn` (ajoute un
  enregistrement DNS chez Cloudflare ; meilleur cache + URL propre)

⚠️ Ce bucket ne doit contenir **que des fichiers destinés au public**
(documents d'archives, images). Jamais de données personnelles (CIN,
listes de membres, exports Excel).

### 4. CORS — autoriser le PUT depuis le site

Dans le bucket → **Settings** → _CORS policy_ :

```json
[
  {
    "AllowedOrigins": ["https://otjm.org.tn", "https://www.otjm.org.tn", "http://localhost:3000"],
    "AllowedMethods": ["PUT"],
    "AllowedHeaders": ["content-type"],
    "MaxAgeSeconds": 3600
  }
]
```

### 5. Jeton d'API

R2 → **Manage R2 API Tokens** → _Create API token_ :

- Permission : **Object Read & Write**
- Portée : _Apply to specific buckets_ → `otjm-fichiers` uniquement
- Noter : _Access Key ID_, _Secret Access Key_, et l'_Account ID_
  (visible dans l'URL du tableau de bord ou sur la page R2)

### 6. Variables d'environnement

Dans Vercel (_Settings → Environment Variables_) puis dans le `.env` local :

| Variable               | Valeur                                           |
| ---------------------- | ------------------------------------------------ |
| `R2_ACCOUNT_ID`        | Account ID Cloudflare                            |
| `R2_ACCESS_KEY_ID`     | Access Key ID du jeton                           |
| `R2_SECRET_ACCESS_KEY` | Secret Access Key du jeton                       |
| `R2_BUCKET`            | `otjm-fichiers`                                  |
| `R2_PUBLIC_BASE_URL`   | `https://pub-xxxxxxxx.r2.dev` (sans slash final) |

Redéployer après ajout.

### 7. Vérification

1. Panneau admin → Archives → _Ajouter une archive_
2. Bouton de téléversement à côté du champ « Image de couverture » →
   choisir une image → l'URL `R2_PUBLIC_BASE_URL/archives/...` doit
   remplir le champ
3. Même test avec un PDF sur « Document (PDF) ou lien externe »
4. Ouvrir l'URL publique dans un onglet privé → le fichier doit s'afficher

## Tant que R2 n'est pas configuré

Le bouton de téléversement répond « Stockage non configuré » et les admins
peuvent continuer à coller des URLs externes — aucune fonctionnalité n'est
bloquée.

## Limites appliquées côté serveur

| Type     | Formats acceptés | Taille max |
| -------- | ---------------- | ---------- |
| Image    | JPEG, PNG, WebP  | 5 Mo       |
| Document | PDF              | 25 Mo      |

Définies dans `src/lib/storage.ts` (`UPLOAD_RULES`) — testées dans
`src/lib/__tests__/storage.test.ts`.
