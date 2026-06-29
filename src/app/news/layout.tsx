import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Actualités',
  description: "Toute l'actualité officielle de l'OTJM : communiqués, déclarations, protestations et annonces pour les jeunes médecins, internes et résidents en Tunisie.",
  alternates: { languages: { fr: '/news', ar: '/ar/news', 'x-default': '/news' } },
  openGraph: {
    title: 'Actualités | OTJM',
    description: "Communiqués, déclarations et annonces officielles de l'OTJM.",
  },
}

export default function NewsLayout({ children }: { children: React.ReactNode }) {
  return children
}
