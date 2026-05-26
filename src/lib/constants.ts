// Category system
export type Category = 'protests' | 'statements' | 'announcements' | 'updates'

export const CATEGORIES: Record<Category, { label: string; color: string; hex: string; activeBg: string; dot: string }> = {
  protests:      { label: 'Protestation',  color: 'text-red-400',   hex: '#EF4444', activeBg: 'rgba(239,68,68,0.12)',   dot: 'bg-red-500' },
  statements:    { label: 'Déclaration',   color: 'text-blue-400',  hex: '#3B82F6', activeBg: 'rgba(59,130,246,0.12)',  dot: 'bg-blue-500' },
  announcements: { label: 'Annonce',       color: 'text-amber-400', hex: '#F59E0B', activeBg: 'rgba(245,158,11,0.12)', dot: 'bg-amber-500' },
  updates:       { label: 'Mise à jour',   color: 'text-slate-400', hex: '#64748B', activeBg: 'rgba(100,116,139,0.12)', dot: 'bg-slate-500' },
}

// Navigation
export const NAV = [
  { label: 'Accueil',    href: '/' },
  { label: 'Actualités', href: '/news' },
  { label: 'Archives',   href: '/archives' },
  { label: 'Adhésion',   href: '/membership' },
]

// Membership
export const MEMBERSHIP_STEPS = [
  {
    num: '01', title: 'Inscription et paiement',
    desc: "Choisissez votre tarif, remplissez le formulaire et payez via Flouci. Moins de 3 minutes.",
    action: undefined,
  },
  {
    num: '02', title: 'Confirmation',
    desc: "Adhésion activée automatiquement dès la confirmation du paiement.",
    action: undefined,
  },
  {
    num: '03', title: 'Retrait de votre carte',
    desc: "Retirez votre carte aux stands OTJM dans votre faculté. Calendrier sur nos réseaux.",
    action: undefined,
  },
]

export const MEMBERSHIP_TIERS = [
  {
    role: 'Externe', price: '10', currency: 'DT',
    description: 'Étudiant en médecine (cycle externe)',
    icon: 'graduation' as const,
    bullets: ['Carte membre officielle', 'Accès aux avantages partenaires', 'Représentation nationale'],
    isPopular: false,
  },
  {
    role: 'Interne / Résident', price: '20', currency: 'DT',
    description: 'Interne hospitalier ou résident en spécialisation',
    icon: 'stethoscope' as const,
    bullets: ['Carte membre officielle', 'Accès aux avantages partenaires', 'Représentation nationale'],
    isPopular: true,
  },
]
