import Link from 'next/link'
import { Check } from 'lucide-react'
import { SiteHeader } from '@/components/otjm/SiteHeader'
import { SiteFooter } from '@/components/otjm/SiteFooter'

export const metadata = { title: 'Paiement confirmé — OTJM', robots: { index: false, follow: true }, alternates: { canonical: '/membership/success' } }

export default function MembershipSuccessPage() {
  return (
    <div className="min-h-screen font-body" style={{ background: 'var(--otjm-bg)' }}>
      <SiteHeader />
      <main className="container mx-auto px-4 max-w-xl py-24 text-center">
        <div className="w-16 h-16 rounded-full bg-[var(--otjm-red)] mx-auto mb-6 flex items-center justify-center">
          <Check className="w-8 h-8 text-white" />
        </div>
        <h1 className="font-editorial text-3xl md:text-4xl font-bold mb-3" style={{ color: 'var(--otjm-text)' }}>
          Paiement confirmé
        </h1>
        <p className="mb-8" style={{ color: 'var(--otjm-text-muted)' }}>
          Votre adhésion OTJM est active. Vous recevrez votre carte membre par email.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 bg-[var(--otjm-red)] text-white font-bold px-6 py-3 rounded-lg hover:bg-[var(--otjm-red-dk)] transition-colors"
        >
          Retour à l'accueil
        </Link>
      </main>
      <SiteFooter />
    </div>
  )
}
