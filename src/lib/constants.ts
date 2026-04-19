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
    num: '01', title: 'Pré-adhésion',
    desc: 'Remplissez le formulaire de pré-adhésion en ligne. Cela prend moins de 3 minutes.',
    action: { label: 'Remplir le formulaire', href: 'https://docs.google.com/forms/d/e/1FAIpQLSf1CBjiCEeIpTJgN_1cNVvdHRA46SqJB0lPzP-f6mN_UTIiQw/viewform' },
  },
  {
    num: '02', title: 'Paiement des frais',
    desc: "Réglez via Cha9a9a.tn selon votre statut (10 DT externe, 20 DT interne/résident).",
    action: { label: 'Payer en ligne', href: 'https://www.cha9a9a.tn/fund/detail/adhesion-otjm-2025-2026-587977' },
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
