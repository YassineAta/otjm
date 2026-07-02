'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Modal } from '@/components/ui/modal'
import {
  FileText,
  Search,
  Eye,
  Edit,
  Trash2,
  ArrowLeft,
  Plus,
  Calendar,
  User,
  Link, // Added for linkUrl
} from 'lucide-react'
import { FileUploadField } from '@/components/admin/file-upload-field'
import { useAdminList } from '@/hooks/use-admin-list'
import { useModalForm } from '@/hooks/use-modal-form'
import { useTableFilter } from '@/hooks/use-table-filter'
import { adminFetch, toastSuccess, toastError } from '@/lib/admin-api'

// --- INTERFACE ---
interface ArchiveItem {
  id: string
  title: string
  excerpt: string
  content: string
  category: string // protests, statements, documents
  documentType: string // Rapport, Déclaration, Charte, etc.
  imageUrl: string | null
  linkUrl: string | null // NEW FIELD
  author: {
    id: string
    name: string
    email: string
  }
  date: string // Date field from schema
  createdAt: string
  updatedAt: string
}

const categoryLabels = {
  protests: 'Protestations',
  statements: 'Déclarations',
  documents: 'Documents',
}

const documentTypeOptions = ['Rapport', 'Déclaration', 'Charte', 'Communiqué', 'Autre']

const DEFAULT_IMAGE_URL = '/otjmlogo.jpg'

export default function ArchiveManagement() {
  const {
    items: archives,
    loading,
    refetch: fetchArchives,
  } = useAdminList<ArchiveItem>('/api/archives', {
    errorMessage: 'Impossible de charger les archives.',
  })

  const {
    search: searchTerm,
    setSearch: setSearchTerm,
    filters,
    setFilter,
    filtered: filteredArchives,
  } = useTableFilter(archives, ['title', 'excerpt'], {
    category: (item, value) => item.category === value,
  })

  // Kept inside the component so reset restores today's date, not module-load date.
  const initialFormData = {
    title: '',
    excerpt: '',
    content: '',
    category: 'documents',
    documentType: 'Rapport',
    imageUrl: '',
    linkUrl: '',
    date: new Date().toISOString().split('T')[0],
  }

  const {
    showAdd: showAddModal,
    setShowAdd: setShowAddModal,
    showEdit: showEditModal,
    setShowEdit: setShowEditModal,
    showView: showViewModal,
    setShowView: setShowViewModal,
    selected: selectedArchive,
    setSelected: setSelectedArchive,
    formData,
    setFormData,
    reset: resetModalsAndForm,
  } = useModalForm<ArchiveItem, typeof initialFormData>(initialFormData)

  const router = useRouter()

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      })
    } catch {
      return 'Date Inconnue'
    }
  }

  // --- SUBMIT (CREATE) FUNCTION ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Logic to set default image URL
    const finalImageUrl = formData.imageUrl.trim() || DEFAULT_IMAGE_URL

    try {
      await adminFetch('/api/archives', {
        method: 'POST',
        // authorId vient de la session côté serveur — ne pas l'envoyer.
        body: {
          ...formData,
          imageUrl: finalImageUrl,
        },
      })
      toastSuccess("L'archive a été créée.")
      resetModalsAndForm()
      fetchArchives()
    } catch {
      toastError("Impossible de créer l'archive.")
    }
  }

  // --- EDIT/VIEW HANDLERS ---
  const handleEdit = (item: ArchiveItem) => {
    setSelectedArchive(item)
    setFormData({
      title: item.title,
      excerpt: item.excerpt,
      content: item.content,
      category: item.category,
      documentType: item.documentType,
      imageUrl: item.imageUrl || '',
      linkUrl: item.linkUrl || '',
      date: new Date(item.date).toISOString().split('T')[0],
    })
    setShowEditModal(true)
  }

  const handleView = (item: ArchiveItem) => {
    setSelectedArchive(item)
    setShowViewModal(true)
  }

  // --- UPDATE FUNCTION ---
  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedArchive) return

    try {
      await adminFetch(`/api/archives/${selectedArchive.id}`, {
        method: 'PATCH',
        body: formData,
      })
      toastSuccess("L'archive a été mise à jour.")
      resetModalsAndForm()
      fetchArchives()
    } catch {
      toastError("Impossible de mettre à jour l'archive.")
    }
  }

  // --- DELETE FUNCTION ---
  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette archive?')) {
      return
    }

    try {
      await adminFetch(`/api/archives/${id}`, { method: 'DELETE' })
      toastSuccess("L'archive a été supprimée.")
      fetchArchives()
    } catch {
      toastError("Impossible de supprimer l'archive.")
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--otjm-red)] mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement des archives...</p>
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
              <h1 className="text-xl font-bold text-gray-900">Gestion des Archives</h1>
            </div>
            <Button
              onClick={() => setShowAddModal(true)}
              className="bg-[var(--otjm-red)] hover:bg-[var(--otjm-red-dk)]"
            >
              <Plus className="w-4 h-4 mr-2" />
              Ajouter une archive
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
                  placeholder="Rechercher par titre ou extrait..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex gap-2">
                <select
                  value={filters.category}
                  onChange={(e) => setFilter('category', e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--otjm-red)]"
                >
                  <option value="all">Toutes les catégories</option>
                  <option value="protests">Protestations</option>
                  <option value="statements">Déclarations</option>
                  <option value="documents">Documents</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Archives List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Liste des Archives ({filteredArchives.length})
            </CardTitle>
            <CardDescription>Gérez tous les documents d'archives de l'OTJM</CardDescription>
          </CardHeader>
          <CardContent>
            {filteredArchives.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Aucune archive trouvée</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredArchives.map((item) => (
                  <div key={item.id} className="border rounded-lg p-4 hover:bg-gray-50">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold">{item.title}</h3>
                          <Badge variant="outline">
                            {categoryLabels[item.category as keyof typeof categoryLabels]}
                          </Badge>
                          <Badge
                            variant="default"
                            className="bg-blue-100 text-blue-800 hover:bg-blue-100"
                          >
                            {item.documentType}
                          </Badge>
                        </div>
                        <p className="text-gray-600 mb-3 line-clamp-2">{item.excerpt}</p>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <div className="flex items-center gap-1">
                            <User className="w-4 h-4" />
                            <span>{item.author?.name}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            <span>{new Date(item.date).toLocaleDateString('fr-FR')}</span>
                          </div>
                          {item.linkUrl && (
                            <div className="flex items-center gap-1 text-[var(--otjm-red)]">
                              <Link className="w-4 h-4" />
                              <span>Lien</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => handleView(item)}>
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleEdit(item)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDelete(item.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Add/Edit Modal */}
      <Dialog open={showAddModal || showEditModal} onOpenChange={resetModalsAndForm}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {showEditModal ? "Modifier l'archive" : 'Ajouter une archive'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={showEditModal ? handleUpdate : handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="title">Titre</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="category">Catégorie</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="protests">Protestations</SelectItem>
                    <SelectItem value="statements">Déclarations</SelectItem>
                    <SelectItem value="documents">Documents</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="documentType">Type de Document</Label>
                <Select
                  value={formData.documentType}
                  onValueChange={(value) => setFormData({ ...formData, documentType: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {documentTypeOptions.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="date">Date de l'Archive</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="excerpt">Extrait</Label>
              <Textarea
                id="excerpt"
                value={formData.excerpt}
                onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                rows={3}
                required
              />
            </div>

            <div>
              <Label htmlFor="content">Contenu</Label>
              <Textarea
                id="content"
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                rows={6}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FileUploadField
                id="imageUrl"
                label="Image de couverture"
                kind="image"
                scope="archives"
                value={formData.imageUrl}
                onChange={(url) => setFormData({ ...formData, imageUrl: url })}
              />
              <FileUploadField
                id="linkUrl"
                label="Document (PDF) ou lien externe"
                kind="document"
                scope="archives"
                value={formData.linkUrl}
                onChange={(url) => setFormData({ ...formData, linkUrl: url })}
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button type="submit" className="bg-[var(--otjm-red)] hover:bg-[var(--otjm-red-dk)]">
                {showEditModal ? "Mettre à jour l'archive" : "Créer l'archive"}
              </Button>
              <Button type="button" variant="outline" onClick={resetModalsAndForm}>
                Annuler
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* --- VIEW MODAL (MODIFIED TO MATCH IMAGE DESIGN) --- */}
      <Modal
        isOpen={showViewModal}
        onClose={resetModalsAndForm}
        title={selectedArchive?.title || "Détails de l'Archive"}
      >
        {selectedArchive && (
          <div className="space-y-4">
            {/* Metadata Line (Badges, Author, Date, Link) */}
            <div className="flex items-center gap-4 text-sm text-gray-500 border-b pb-3">
              {/* Category Badge (Déclarations) */}
              <Badge
                variant="default"
                className="bg-[var(--otjm-red)]/10 text-[var(--otjm-red-dk)] hover:bg-[var(--otjm-red)]/10"
              >
                {categoryLabels[selectedArchive.category as keyof typeof categoryLabels]}
              </Badge>

              {/* Document Type Badge (Rapport) */}
              <Badge variant="outline" className="bg-blue-100 text-blue-800 hover:bg-blue-100">
                {selectedArchive.documentType}
              </Badge>

              {/* Author (Administrator) */}
              <span className="flex items-center gap-1">
                <User className="w-4 h-4" />
                {selectedArchive.author?.name || 'Auteur Inconnu'}
              </span>

              {/* Date (06/01/2025) */}
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {formatDate(selectedArchive.date)}
              </span>

              {/* External Link (Voir le lien externe) */}
              {selectedArchive.linkUrl && (
                <a
                  href={selectedArchive.linkUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-[var(--otjm-red)] hover:text-[var(--otjm-red)] font-medium"
                >
                  <Link className="w-4 h-4" />
                  Voir le lien externe
                </a>
              )}
            </div>

            {/* Content Area (Mapping the content to the area below the metadata) */}
            <div className="prose max-w-none">
              {/* Image Section */}
              {selectedArchive.imageUrl && (
                <div className="w-full bg-gray-100 flex items-center justify-center rounded-lg border overflow-hidden mb-4">
                  <img
                    src={selectedArchive.imageUrl}
                    alt={selectedArchive.title}
                    className="max-w-full h-auto max-h-80 object-contain"
                  />
                </div>
              )}

              {/* Displaying the content/excerpt similar to the image's text area */}
              <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                {selectedArchive.content}
              </p>

              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-sm font-semibold text-gray-700">Extrait:</p>
                <p className="text-gray-600 italic">{selectedArchive.excerpt}</p>

                {selectedArchive.author?.email && (
                  <p className="text-xs text-gray-500 mt-2">
                    Email de l'auteur: {selectedArchive.author.email}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
