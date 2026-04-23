'use client'

import { Button } from '@/components/ui/button'

export default function AdminError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center max-w-md">
        <h2 className="text-xl font-bold text-gray-900 mb-2">Une erreur est survenue</h2>
        <p className="text-sm text-gray-500 mb-6">Veuillez réessayer ou contacter l'administrateur.</p>
        <Button onClick={reset} className="bg-[var(--otjm-red)] hover:bg-[var(--otjm-red-dk)]">Réessayer</Button>
      </div>
    </div>
  )
}
