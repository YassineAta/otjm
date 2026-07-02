'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ArrowLeft, Copy, Plus, Shield, Trash2, User } from 'lucide-react'
import { useAdminList } from '@/hooks/use-admin-list'
import { adminFetch, toastSuccess, toastError } from '@/lib/admin-api'

interface AdminAccount {
  id: string
  email: string
  name: string | null
  role: string
  createdAt: string
}

interface CreatedAccount {
  email: string
  tempPassword: string
}

export default function AdminAccountsManagement() {
  const router = useRouter()
  const {
    items: admins,
    loading,
    refetch: fetchAdmins,
  } = useAdminList<AdminAccount>('/api/admin/admins', {
    errorMessage: 'Impossible de charger les comptes administrateurs (accès superadmin requis).',
  })

  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState({ name: '', email: '' })
  const [creating, setCreating] = useState(false)
  // Rempli après création : le mot de passe n'est affiché qu'une seule fois.
  const [created, setCreated] = useState<CreatedAccount | null>(null)

  const closeCreate = () => {
    setShowCreate(false)
    setForm({ name: '', email: '' })
    setCreated(null)
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreating(true)
    try {
      const res = await adminFetch('/api/admin/admins', {
        method: 'POST',
        body: form,
        fallbackError: 'Échec de la création du compte.',
      })
      const data = await res.json()
      setCreated({ email: data.email, tempPassword: data.tempPassword })
      fetchAdmins()
    } catch (err) {
      toastError(err instanceof Error ? err.message : 'Échec de la création du compte.')
    } finally {
      setCreating(false)
    }
  }

  const handleCopy = async () => {
    if (!created) return
    await navigator.clipboard.writeText(created.tempPassword)
    toastSuccess('Mot de passe copié.')
  }

  const handleDelete = async (account: AdminAccount) => {
    if (!confirm(`Supprimer le compte de ${account.name || account.email} ?`)) return
    try {
      await adminFetch(`/api/admin/admins/${account.id}`, {
        method: 'DELETE',
        fallbackError: 'Échec de la suppression.',
      })
      toastSuccess('Compte supprimé — cette personne ne peut plus se connecter.')
      fetchAdmins()
    } catch (err) {
      toastError(err instanceof Error ? err.message : 'Échec de la suppression.')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--otjm-red)] mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement des comptes...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <Button
                onClick={() => router.push('/admin/dashboard')}
                variant="outline"
                className="text-[var(--otjm-red)] border-[var(--otjm-red)]/20 hover:bg-[var(--otjm-red)]/5"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Retour
              </Button>
              <h1 className="text-xl font-bold text-gray-900">Comptes Administrateurs</h1>
            </div>
            <Button
              onClick={() => setShowCreate(true)}
              className="bg-[var(--otjm-red)] hover:bg-[var(--otjm-red-dk)]"
            >
              <Plus className="w-4 h-4 mr-2" />
              Créer un compte
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Comptes avec accès au panneau ({admins.length})
            </CardTitle>
            <CardDescription>
              Ces comptes peuvent se connecter et gérer le contenu (archives, actualités, membres).
              Réservé au superadmin.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {admins.map((account) => (
                <div
                  key={account.id}
                  className="border rounded-lg p-4 flex items-center justify-between hover:bg-gray-50"
                >
                  <div className="flex items-center gap-3">
                    <User className="w-8 h-8 text-gray-400" />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{account.name || account.email}</span>
                        <Badge
                          variant={account.role === 'superadmin' ? 'default' : 'outline'}
                          className={
                            account.role === 'superadmin'
                              ? 'bg-[var(--otjm-red)]/10 text-[var(--otjm-red-dk)] hover:bg-[var(--otjm-red)]/10'
                              : 'bg-blue-100 text-blue-800 hover:bg-blue-100'
                          }
                        >
                          {account.role}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-500">{account.email}</p>
                    </div>
                  </div>
                  {account.role !== 'superadmin' && (
                    <Button size="sm" variant="destructive" onClick={() => handleDelete(account)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>

      <Dialog open={showCreate} onOpenChange={closeCreate}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {created ? 'Compte créé — transmettez le mot de passe' : 'Créer un compte admin'}
            </DialogTitle>
          </DialogHeader>

          {created ? (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Compte <strong>{created.email}</strong> créé. Ce mot de passe est affiché{' '}
                <strong>une seule fois</strong> — copiez-le maintenant et transmettez-le par un
                canal privé (appel, message direct), avec l&apos;adresse secrète de connexion au
                panneau.
              </p>
              <div className="flex items-center gap-2">
                <code className="flex-1 bg-gray-100 border rounded-md px-3 py-2 text-lg tracking-wide text-center select-all">
                  {created.tempPassword}
                </code>
                <Button type="button" variant="outline" onClick={handleCopy} title="Copier">
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
              <Button type="button" className="w-full" variant="outline" onClick={closeCreate}>
                J&apos;ai transmis le mot de passe — fermer
              </Button>
            </div>
          ) : (
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <Label htmlFor="admin-name">Nom</Label>
                <Input
                  id="admin-name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="admin-email">Email</Label>
                <Input
                  id="admin-email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                />
              </div>
              <div className="flex gap-2 pt-2">
                <Button
                  type="submit"
                  disabled={creating}
                  className="bg-[var(--otjm-red)] hover:bg-[var(--otjm-red-dk)]"
                >
                  {creating ? 'Création...' : 'Créer le compte'}
                </Button>
                <Button type="button" variant="outline" onClick={closeCreate}>
                  Annuler
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
