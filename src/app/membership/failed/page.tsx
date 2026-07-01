import Link from 'next/link'
import { X } from 'lucide-react'
import { SiteHeader } from '@/components/otjm/SiteHeader'
import { SiteFooter } from '@/components/otjm/SiteFooter'

export const metadata = {
  title: 'Paiement non abouti — OTJM',
  robots: { index: false, follow: true },
  alternates: { canonical: '/membership/failed' },
}

export default function MembershipFailedPage() {
  return (
    <div className="min-h-screen font-body" style={{ background: 'var(--otjm-bg)' }}>
      <SiteHeader />
      <main className="container mx-auto px-4 max-w-xl py-24 text-center">
        <div className="w-16 h-16 rounded-full border-2 border-[var(--otjm-red)] mx-auto mb-6 flex items-center justify-center">
          <X className="w-8 h-8 text-[var(--otjm-red)]" />
        </div>
        <h1
          className="font-editorial text-3xl md:text-4xl font-bold mb-3"
          style={{ color: 'var(--otjm-text)' }}
        >
          Paiement non abouti
        </h1>
        <p className="mb-8" style={{ color: 'var(--otjm-text-muted)' }}>
          Votre paiement n'a pas pu être confirmé. Aucun montant n'a été débité. Vous pouvez
          réessayer ou nous contacter si le problème persiste.
        </p>
        <div className="flex gap-3 justify-center">
          <Link
            href="/membership"
            className="inline-flex items-center gap-2 bg-[var(--otjm-red)] text-white font-bold px-6 py-3 rounded-lg hover:bg-[var(--otjm-red-dk)] transition-colors"
          >
            Réessayer
          </Link>
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 border border-[var(--otjm-text-muted)] font-bold px-6 py-3 rounded-lg transition-colors"
            style={{ color: 'var(--otjm-text)' }}
          >
            Nous contacter
          </Link>
        </div>
      </main>
      <SiteFooter />
    </div>
  )
}
