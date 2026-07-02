import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Adhésion',
  description:
    "Adhérez à l'OTJM en moins de 3 minutes : choisissez votre tarif (externe 10 DT, interne/résident 20 DT), payez en ligne via Flouci et recevez votre carte de membre officielle.",
  alternates: {
    languages: { fr: '/membership', ar: '/ar/membership', 'x-default': '/membership' },
  },
  openGraph: {
    title: 'Adhésion | OTJM',
    description:
      "Devenez membre officiel de l'OTJM. Adhésion 100% en ligne, carte de membre incluse.",
  },
}

export default function MembershipLayout({ children }: { children: React.ReactNode }) {
  return children
}
