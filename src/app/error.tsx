'use client'

import { Button } from '@/components/ui/button'

export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--otjm-bg)] font-body">
      <div className="text-center max-w-md px-4">
        <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--otjm-text)' }}>Une erreur est survenue</h2>
        <p className="text-sm mb-6" style={{ color: 'var(--otjm-text-muted)' }}>La page n'a pas pu être chargée.</p>
        <Button onClick={reset} style={{ background: 'var(--otjm-red)', color: '#fff' }}>Réessayer</Button>
      </div>
    </div>
  )
}
