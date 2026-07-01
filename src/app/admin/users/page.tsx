'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Modal } from '@/components/ui/modal'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Users,
  Search,
  Filter,
  Eye,
  Edit,
  Trash2,
  ArrowLeft,
  Plus,
  Shield,
  UserPlus,
  Lock,
  Unlock,
} from 'lucide-react'
import { useAdminList } from '@/hooks/use-admin-list'
import { useModalForm } from '@/hooks/use-modal-form'
import { useTableFilter } from '@/hooks/use-table-filter'
import { adminFetch, toastSuccess, toastError } from '@/lib/admin-api'

interface AdminUser {
  id: string
  email: string
  name: string
  role: string
  createdAt: string
  updatedAt: string
}

const initialFormData = {
  email: '',
  name: '',
  role: 'member',
  password: '',
}

export default function AdminUserManagement() {
  const {
    items: users,
    loading,
    refetch: fetchUsers,
  } = useAdminList<AdminUser>('/api/admin/users', {
    errorMessage: 'Impossible de charger les utilisateurs.',
  })

  const {
    search: searchTerm,
    setSearch: setSearchTerm,
    filters,
    setFilter,
    filtered: filteredUsers,
  } = useTableFilter(users, ['name', 'email'], {
    role: (user, value) => user.role === value,
  })

  const {
    showAdd: showAddModal,
    setShowAdd: setShowAddModal,
    showEdit: showEditModal,
    setShowEdit: setShowEditModal,
    showView: showViewModal,
    setShowView: setShowViewModal,
    selected: selectedUser,
    setSelected: setSelectedUser,
    formData,
    setFormData,
    reset: resetModalsAndForm,
  } = useModalForm<AdminUser, typeof initialFormData>(initialFormData)

  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      await adminFetch('/api/admin/users', {
        method: 'POST',
        body: formData,
      })
      toastSuccess("L'utilisateur a été créé.")
      resetModalsAndForm()
      fetchUsers()
    } catch {
      toastError("Impossible de créer l'utilisateur.")
    }
  }

  const handleEdit = (user: AdminUser) => {
    setSelectedUser(user)
    setFormData({
      email: user.email,
      name: user.name || '',
      role: user.role,
      password: '',
    })
    setShowEditModal(true)
  }

  const handleView = (user: AdminUser) => {
    setSelectedUser(user)
    setShowViewModal(true)
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedUser) return

    try {
      await adminFetch(`/api/admin/users/${selectedUser.id}`, {
        method: 'PATCH',
        body: { name: formData.name, role: formData.role },
      })
      toastSuccess("L'utilisateur a été mis à jour.")
      resetModalsAndForm()
      fetchUsers()
    } catch {
      toastError("Impossible de mettre à jour l'utilisateur.")
    }
  }

  const handleDelete = async (userId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur?')) {
      return
    }

    try {
      await adminFetch(`/api/admin/users/${userId}`, { method: 'DELETE' })
      toastSuccess("L'utilisateur a été supprimé.")
      fetchUsers()
    } catch {
      toastError("Impossible de supprimer l'utilisateur.")
    }
  }

  const handleResetPassword = async (userId: string) => {
    try {
      await adminFetch(`/api/admin/users/${userId}/reset-password`, { method: 'POST' })
      toastSuccess('Le mot de passe a été réinitialisé.')
    } catch {
      toastError('Impossible de réinitialiser le mot de passe.')
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-[var(--otjm-red)]/10 text-[var(--otjm-red-dk)]'
      case 'member':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getRoleText = (role: string) => {
    switch (role) {
      case 'admin':
        return 'Administrateur'
      case 'member':
        return 'Membre'
      default:
        return role
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--otjm-red)] mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement des utilisateurs...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
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
              <h1 className="text-xl font-bold text-gray-900">Gestion des Utilisateurs</h1>
            </div>
            <Button
              onClick={() => setShowAddModal(true)}
              className="bg-[var(--otjm-red)] hover:bg-[var(--otjm-red-dk)]"
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Ajouter un utilisateur
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Rechercher par nom ou email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex gap-2">
                <select
                  value={filters.role}
                  onChange={(e) => setFilter('role', e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--otjm-red)]"
                >
                  <option value="all">Tous les rôles</option>
                  <option value="admin">Administrateurs</option>
                  <option value="member">Membres</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Users List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Liste des Utilisateurs ({filteredUsers.length})
            </CardTitle>
            <CardDescription>Gérez tous les utilisateurs de l'administration</CardDescription>
          </CardHeader>
          <CardContent>
            {filteredUsers.length === 0 ? (
              <div className="text-center py-8">
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Aucun utilisateur trouvé</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3 font-medium">Utilisateur</th>
                      <th className="text-left p-3 font-medium">Rôle</th>
                      <th className="text-left p-3 font-medium">Date de création</th>
                      <th className="text-left p-3 font-medium">Dernière mise à jour</th>
                      <th className="text-left p-3 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((user) => (
                      <tr key={user.id} className="border-b hover:bg-gray-50">
                        <td className="p-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                              {user.role === 'admin' ? (
                                <Shield className="w-5 h-5 text-[var(--otjm-red)]" />
                              ) : (
                                <Users className="w-5 h-5 text-blue-600" />
                              )}
                            </div>
                            <div>
                              <p className="font-medium">{user.name || 'N/A'}</p>
                              <p className="text-sm text-gray-500">{user.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-3">
                          <Badge className={getRoleColor(user.role)}>
                            {getRoleText(user.role)}
                          </Badge>
                        </td>
                        <td className="p-3">
                          <div className="text-sm">
                            <p>{new Date(user.createdAt).toLocaleDateString('fr-FR')}</p>
                            <p className="text-gray-500">
                              {new Date(user.createdAt).toLocaleTimeString('fr-FR')}
                            </p>
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="text-sm">
                            <p>{new Date(user.updatedAt).toLocaleDateString('fr-FR')}</p>
                            <p className="text-gray-500">
                              {new Date(user.updatedAt).toLocaleTimeString('fr-FR')}
                            </p>
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" onClick={() => handleView(user)}>
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => handleEdit(user)}>
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleResetPassword(user.id)}
                            >
                              <Lock className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDelete(user.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Add/Edit Modal */}
      <Dialog
        open={showAddModal || showEditModal}
        onOpenChange={(open) => {
          if (!open) {
            setShowAddModal(false)
            setShowEditModal(false)
            setSelectedUser(null)
            setFormData({
              email: '',
              name: '',
              role: 'member',
              password: '',
            })
          }
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {showEditModal ? "Modifier l'utilisateur" : 'Ajouter un utilisateur'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={showEditModal ? handleUpdate : handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                disabled={showEditModal} // Email cannot be edited
              />
            </div>

            <div>
              <Label htmlFor="name">Nom complet</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="role">Rôle</Label>
              <Select
                value={formData.role}
                onValueChange={(value) => setFormData({ ...formData, role: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="member">Membre</SelectItem>
                  <SelectItem value="admin">Administrateur</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {!showEditModal && (
              <div>
                <Label htmlFor="password">Mot de passe</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Laisser vide pour ne pas modifier"
                />
              </div>
            )}

            <div className="flex gap-2 pt-4">
              <Button type="submit" className="bg-[var(--otjm-red)] hover:bg-[var(--otjm-red-dk)]">
                {showEditModal ? 'Mettre à jour' : 'Créer'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowAddModal(false)
                  setShowEditModal(false)
                  setSelectedUser(null)
                  setFormData({
                    email: '',
                    name: '',
                    role: 'member',
                    password: '',
                  })
                }}
              >
                Annuler
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Modal */}
      <Modal
        isOpen={showViewModal}
        onClose={() => setShowViewModal(false)}
        title="Détails de l'utilisateur"
      >
        {selectedUser && (
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                {selectedUser.role === 'admin' ? (
                  <Shield className="w-8 h-8 text-[var(--otjm-red)]" />
                ) : (
                  <Users className="w-8 h-8 text-blue-600" />
                )}
              </div>
              <div>
                <h3 className="text-xl font-semibold">{selectedUser.name || 'N/A'}</h3>
                <p className="text-gray-500">{selectedUser.email}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b">
                <span className="text-gray-600">Rôle</span>
                <Badge className={getRoleColor(selectedUser.role)}>
                  {getRoleText(selectedUser.role)}
                </Badge>
              </div>

              <div className="flex items-center justify-between py-3 border-b">
                <span className="text-gray-600">Email</span>
                <span className="font-medium">{selectedUser.email}</span>
              </div>

              <div className="flex items-center justify-between py-3 border-b">
                <span className="text-gray-600">Nom complet</span>
                <span className="font-medium">{selectedUser.name || 'N/A'}</span>
              </div>

              <div className="flex items-center justify-between py-3 border-b">
                <span className="text-gray-600">Date de création</span>
                <span className="font-medium">
                  {new Date(selectedUser.createdAt).toLocaleDateString('fr-FR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>

              <div className="flex items-center justify-between py-3">
                <span className="text-gray-600">Dernière mise à jour</span>
                <span className="font-medium">
                  {new Date(selectedUser.updatedAt).toLocaleDateString('fr-FR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
