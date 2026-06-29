import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Politique de confidentialité',
  description: "Politique de confidentialité de l'OTJM : comment l'Organisation Tunisienne Des Jeunes Médecins collecte, protège et traite vos données personnelles.",
  alternates: { languages: { fr: '/privacy', ar: '/ar/privacy', 'x-default': '/privacy' } },
}

export default function PrivacyLayout({ children }: { children: React.ReactNode }) {
  return children
}
