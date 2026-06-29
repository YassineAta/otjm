import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Archives',
  description: "Archives des actions, communiqués et documents officiels de l'Organisation Tunisienne Des Jeunes Médecins (OTJM).",
  alternates: { languages: { fr: '/archives', ar: '/ar/archives', 'x-default': '/archives' } },
  openGraph: {
    title: 'Archives | OTJM',
    description: "Archives des communiqués et documents officiels de l'OTJM.",
  },
}

export default function ArchivesLayout({ children }: { children: React.ReactNode }) {
  return children
}
