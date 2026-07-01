'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Loader2 } from 'lucide-react'

export type SignupTier = 'externe' | 'interne'

interface Props {
  open: boolean
  tier: SignupTier | null
  tierLabel: string
  priceTnd: number
  onClose: () => void
}

export function MembershipSignupModal({ open, tier, tierLabel, priceTnd, onClose }: Props) {
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    cin: '',
    dateOfBirth: '',
    faculty: '',
    memberStatus: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setError(null)
      setSubmitting(false)
    }
  }, [open])

  const update =
    (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [k]: e.target.value }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!tier) return
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch('/api/payment/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, tier, memberStatus: form.memberStatus || tierLabel }),
      })
      const data = await res.json()
      if (!res.ok || !data.link) {
        setError(data?.message || 'Erreur lors de la création du paiement.')
        setSubmitting(false)
        return
      }
      window.location.href = data.link
    } catch {
      setError('Connexion impossible. Réessayez.')
      setSubmitting(false)
    }
  }

  return (
    <AnimatePresence>
      {open && tier && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            className="w-full max-w-lg rounded-2xl border p-6 max-h-[90vh] overflow-y-auto"
            style={{ background: 'var(--otjm-bg)', borderColor: 'rgba(255,255,255,0.1)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-5">
              <div>
                <h2
                  className="font-editorial text-2xl font-bold"
                  style={{ color: 'var(--otjm-text)' }}
                >
                  Adhésion {tierLabel}
                </h2>
                <p className="text-sm mt-1" style={{ color: 'var(--otjm-text-muted)' }}>
                  Paiement sécurisé Flouci — {priceTnd} DT / an
                </p>
              </div>
              <button onClick={onClose} aria-label="Fermer" className="p-1">
                <X className="w-5 h-5" style={{ color: 'var(--otjm-text-muted)' }} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <Field
                label="Nom complet *"
                value={form.fullName}
                onChange={update('fullName')}
                required
              />
              <Field
                label="Email *"
                type="email"
                value={form.email}
                onChange={update('email')}
                required
              />
              <Field label="Téléphone" type="tel" value={form.phone} onChange={update('phone')} />
              <Field label="CIN" value={form.cin} onChange={update('cin')} />
              <Field
                label="Date de naissance"
                type="date"
                value={form.dateOfBirth}
                onChange={update('dateOfBirth')}
              />
              <Field
                label="Faculté"
                value={form.faculty}
                onChange={update('faculty')}
                placeholder="Faculté de médecine de Tunis"
              />

              {error && <div className="text-sm text-[var(--otjm-red)] px-1">{error}</div>}

              <button
                type="submit"
                disabled={submitting}
                className="w-full inline-flex items-center justify-center gap-2 bg-[var(--otjm-red)] text-white font-bold py-3 rounded-lg hover:bg-[var(--otjm-red-dk)] transition-colors disabled:opacity-60"
              >
                {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                {submitting ? 'Redirection…' : `Payer ${priceTnd} DT`}
              </button>
              <p className="text-xs text-center" style={{ color: 'var(--otjm-text-muted)' }}>
                Vous serez redirigé vers Flouci pour finaliser le paiement.
              </p>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function Field({
  label,
  value,
  onChange,
  type = 'text',
  required = false,
  placeholder,
}: {
  label: string
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  type?: string
  required?: boolean
  placeholder?: string
}) {
  return (
    <label className="block">
      <span
        className="text-xs font-semibold uppercase tracking-wide mb-1 block"
        style={{ color: 'var(--otjm-text-muted)' }}
      >
        {label}
      </span>
      <input
        type={type}
        required={required}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full px-3 py-2 rounded-lg border bg-transparent text-sm focus:outline-none focus:border-[var(--otjm-red)] transition-colors"
        style={{ color: 'var(--otjm-text)', borderColor: 'rgba(255,255,255,0.15)' }}
      />
    </label>
  )
}
