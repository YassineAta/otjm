// Provisionnement temporaire des comptes admin (ADR-010) : le superadmin crée
// le compte, transmet le mot de passe généré par un canal privé. La phase
// d'authentification remplacera cette remise en main propre par une invitation
// par email — les lignes Admin, elles, ne changeront pas.
import { randomInt } from 'crypto'

// Sans caractères ambigus (0/O, 1/l/I, i/o) : le mot de passe se transmet
// oralement ou par message et doit se retranscrire sans erreur.
const ALPHABET = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789'

/** Mot de passe temporaire fort (~86 bits), lisible : xxxxx-xxxxx-xxxxx. */
export function generateTempPassword(): string {
  const groups: string[] = []
  for (let g = 0; g < 3; g++) {
    let s = ''
    for (let i = 0; i < 5; i++) s += ALPHABET[randomInt(ALPHABET.length)]
    groups.push(s)
  }
  return groups.join('-')
}

/** Garde de suppression d'un compte admin — message d'erreur français, ou null si permis. */
export function canDeleteAdmin(
  actorEmail: string,
  target: { email: string; role: string },
): string | null {
  if (target.role === 'superadmin') return 'Impossible de supprimer un compte superadmin.'
  if (target.email === actorEmail) return 'Impossible de supprimer votre propre compte.'
  return null
}
