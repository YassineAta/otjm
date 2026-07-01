# Journal des modifications

Toutes les modifications notables de ce projet sont consignées dans ce fichier.

Le format s'appuie sur [Keep a Changelog](https://keepachangelog.com/fr/1.1.0/)
et le projet suit le [versionnage sémantique](https://semver.org/lang/fr/).

## [Non publié] — branche `fable/hardening`

Chantier de durcissement, performance, sécurité et documentation. Aucune
modification de la base de données de production tant que le snapshot Atlas
n'a pas été fourni (phases 4 et 5 gelées).

### Phase 1 — Hygiène du code et outillage

#### Ajouté

- **Prettier** : configuration `.prettierrc.json` (guillemets simples, sans
  point-virgule, largeur 100) + `.prettierignore`. Scripts `format` et
  `format:check`.
- **Intégration continue** (`.github/workflows/ci.yml`) : à chaque push et
  pull request — formatage, lint, typage strict (`tsc`), tests Vitest et scan
  de vulnérabilités. Le typage et les tests sont bloquants ; les vulnérabilités
  bloquent au niveau « critical » (les « high » restants dépendent de bumps
  cassants traités séparément et sont reportés en information).
- Script `typecheck` (`tsc --noEmit`).

#### Modifié

- **ESLint** : la configuration désactivait *toutes* les règles utiles
  (commentaires d'un template). Réactivation des détecteurs de bugs à fort
  signal (`no-debugger` en erreur, `no-unreachable`, `no-redeclare`,
  variables inutilisées et `prefer-const` en avertissement). Les règles
  purement stylistiques bruyantes sur du contenu francophone
  (`react/no-unescaped-entities`) restent désactivées.
- **Dépendances** : `npm audit fix` non cassant appliqué — 14 → 6
  vulnérabilités. Les 6 restantes exigent des mises à jour cassantes
  (nodemailer 9, exceljs) et sont traitées dans des PR dédiées (voir
  « Sécurité — reporté »).
- Formatage Prettier appliqué à l'ensemble du dépôt (137 fichiers,
  formatage pur, aucun changement de comportement).

#### Supprimé

- Import inutilisé (`staggerReduced`) et directive `eslint-disable` obsolète.

### Sécurité — reporté (PR dédiées, hors périmètre code actuel)

- **nodemailer** : bump vers la v9 (cassant) + test — injection CRLF possible
  via l'adresse destinataire (issue du formulaire d'adhésion).
- **exceljs** : la vulnérabilité transitive (`uuid` < 11.1.1, bornes de buffer
  sur `uuid` v3/v5/v6 avec argument `buf`) n'atteint pas notre usage
  (parsing xlsx admin uniquement, sans appel `uuid` avec `buf`). Décision :
  correction en avant plutôt que downgrade vers exceljs 3 — à valider par test.

### Notes

- Next.js 15.5.15 est déjà installé (> 15.2.3) : le CVE de contournement du
  middleware est corrigé, et l'hébergement Vercel neutralise le vecteur côté
  plateforme. Les patches restants relèvent de la défense en profondeur.
