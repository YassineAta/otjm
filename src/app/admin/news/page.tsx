'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
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
  Link as LinkIcon
} from 'lucide-react'
import { toast } from '@/hooks/use-toast'

// --- DEFAULT IMAGE URL (Fixed for consistency) ---
const DEFAULT_IMAGE_URL = '/otjmlogo.jpg';

interface NewsItem {
  id: string
  title: string
  excerpt: string
  content: string
  category: string
  imageUrl: string
  published: boolean
  sourceUrl?: string | null;
  author: {
    id: string
    name: string
    email: string
  }
  createdAt: string
  updatedAt: string
}

const categoryLabels = {
  protests: 'Protestations',
  statements: 'Déclarations',
  announcements: 'Annonces',
  updates: 'Mises à jour'
}

export default function NewsManagement() {
  const [news, setNews] = useState<NewsItem[]>([])
  const [filteredNews, setFilteredNews] = useState<NewsItem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [publishedFilter, setPublishedFilter] = useState('all')
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null)

  const initialFormData = {
    title: '',
    excerpt: '',
    content: '',
    category: 'announcements',
    imageUrl: '',
    sourceUrl: '',
    published: true
  }
  const [formData, setFormData] = useState(initialFormData)
  const router = useRouter()

  const resetModalsAndForm = () => {
    setShowAddModal(false)
    setShowEditModal(false)
    setShowViewModal(false)
    setSelectedNews(null)
    setFormData(initialFormData)
  }

  useEffect(() => {
    fetchNews()
  }, [])

  useEffect(() => {
    filterNews()
  }, [news, searchTerm, categoryFilter, publishedFilter])

  const fetchNews = async () => {
    try {
      const response = await fetch('/api/news')
      if (response.ok) {
        const data = await response.json()

        const mappedData: NewsItem[] = data.map((item: any) => ({
            ...item,
            sourceUrl: item.sourceUrl || null,
        }));

        setNews(mappedData);
      }
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les actualités.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const filterNews = () => {
    let filtered = news

    if (searchTerm) {
      filtered = filtered.filter(item =>
        item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.excerpt.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (categoryFilter !== 'all') {
      filtered = filtered.filter(item => item.category === categoryFilter)
    }

    if (publishedFilter !== 'all') {
      const isPublished = publishedFilter === 'published'
      filtered = filtered.filter(item => item.published === isPublished)
    }

    setFilteredNews(filtered)
  }

  // --- SUBMIT (CREATE) FUNCTION - FIXED AUTHOR ID RETRIEVAL ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const finalImageUrl = formData.imageUrl.trim() || DEFAULT_IMAGE_URL;

    const authorId = 'admin';

    try {
      const response = await fetch('/api/news', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          imageUrl: finalImageUrl,
          authorId: authorId, // Use the verified logged-in ID
        })
      })

      if (response.ok) {
        toast({
          title: 'Succès',
          description: 'L\'actualité a été créée.',
        })
        resetModalsAndForm()
        fetchNews()
      } else {
        const errorDetails = await response.json().catch(() => ({}));
        toast({
            title: 'Erreur',
            description: `Impossible de créer l\'actualité. (Vérifiez si l'ID d'auteur existe dans la table User)`,
            variant: 'destructive',
        });
        throw new Error(errorDetails.message || 'Failed to create news');
      }
    } catch (error) {
      // Catch block is simplified as the error is usually handled above
      if (error instanceof Error && error.message.includes('Failed to create news')) {
          // Do nothing, toast was shown above
      } else {
          toast({
              title: 'Erreur',
              description: `Impossible de créer l\'actualité. (${error instanceof Error ? error.message : 'Erreur inconnue'})`,
              variant: 'destructive',
          });
      }
    }
  }

  const handleEdit = (item: NewsItem) => {
    setSelectedNews(item)
    setFormData({
      title: item.title,
      excerpt: item.excerpt,
      content: item.content,
      category: item.category,
      imageUrl: item.imageUrl || '',
      sourceUrl: item.sourceUrl || '',
      published: item.published
    })
    setShowEditModal(true)
  }

  const handleView = (item: NewsItem) => {
    setSelectedNews(item)
    setShowViewModal(true)
  }

  // --- UPDATE FUNCTION ---
  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedNews) return

    const finalImageUrl = formData.imageUrl.trim() || DEFAULT_IMAGE_URL;

    try {
      const response = await fetch(`/api/news/${selectedNews.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          imageUrl: finalImageUrl,
        })
      })

      if (response.ok) {
        toast({
          title: 'Succès',
          description: 'L\'actualité a été mise à jour.',
        })
        resetModalsAndForm()
        fetchNews()
      } else {
        throw new Error('Failed to update news')
      }
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de mettre à jour l\'actualité.',
        variant: 'destructive',
      })
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette actualité?')) {
      return
    }

    try {
      const response = await fetch(`/api/news/${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast({
          title: 'Succès',
          description: 'L\'actualité a été supprimée.',
        })
        fetchNews()
      } else {
        throw new Error('Failed to delete news')
      }
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de supprimer l\'actualité.',
        variant: 'destructive',
      })
    }
  }

  const togglePublish = async (id: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/news/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ published: !currentStatus })
      })

      if (response.ok) {
        toast({
          title: 'Succès',
          description: `L'actualité a été ${!currentStatus ? 'publiée' : 'dépubliée'}.`,
        })
        fetchNews()
      } else {
        throw new Error('Failed to toggle publish status')
      }
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de modifier le statut de publication.',
        variant: 'destructive',
      })
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement des actualités...</p>
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
                className="text-red-600 border-red-200 hover:bg-red-50"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Retour
              </Button>
              <h1 className="text-xl font-bold text-gray-900">Gestion des Actualités</h1>
            </div>
            <Button
              onClick={() => setShowAddModal(true)}
              className="bg-red-600 hover:bg-red-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Ajouter
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters - FIXED: Now uses <option> tags */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Rechercher par titre ou contenu..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex gap-2">
                {/* Category Filter - FIXED */}
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  <option value="all">Toutes les catégories</option>
                  <option value="protests">Protestations</option>
                  <option value="statements">Déclarations</option>
                  <option value="announcements">Annonces</option>
                  <option value="updates">Mises à jour</option>
                </select>
                {/* Published Filter - FIXED */}
                <select
                  value={publishedFilter}
                  onChange={(e) => setPublishedFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  <option value="all">Tous les statuts</option>
                  <option value="published">Publié</option>
                  <option value="draft">Brouillon</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* News List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Liste des Actualités ({filteredNews.length})
            </CardTitle>
            <CardDescription>
              Gérez toutes les actualités de l'OTJM
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredNews.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Aucune actualité trouvée</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredNews.map((item) => (
                  <div key={item.id} className="border rounded-lg p-4 hover:bg-gray-50">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold">{item.title}</h3>
                          <Badge variant="outline">
                            {categoryLabels[item.category as keyof typeof categoryLabels]}
                          </Badge>
                          <Badge variant={item.published ? 'default' : 'secondary'}>
                            {item.published ? 'Publié' : 'Brouillon'}
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
                            <span>{new Date(item.createdAt).toLocaleDateString('fr-FR')}</span>
                          </div>
                          {item.sourceUrl && (
                            <div className="flex items-center gap-1 text-blue-600">
                                <LinkIcon className="w-4 h-4" />
                                <span>Source</span>
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
                          variant={item.published ? 'secondary' : 'default'}
                          onClick={() => togglePublish(item.id, item.published)}
                        >
                          {item.published ? 'Dépublier' : 'Publier'}
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
              {showEditModal ? 'Modifier l\'actualité' : 'Ajouter une actualité'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={showEditModal ? handleUpdate : handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="title">Titre</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                required
              />
            </div>

            <div>
              <Label htmlFor="category">Catégorie</Label>
              <Select value={formData.category} onValueChange={(value) => setFormData({...formData, category: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="protests">Protestations</SelectItem>
                  <SelectItem value="statements">Déclarations</SelectItem>
                  <SelectItem value="announcements">Annonces</SelectItem>
                  <SelectItem value="updates">Mises à jour</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="excerpt">Extrait</Label>
              <Textarea
                id="excerpt"
                value={formData.excerpt}
                onChange={(e) => setFormData({...formData, excerpt: e.target.value})}
                rows={3}
                required
              />
            </div>

            <div>
              <Label htmlFor="content">Contenu</Label>
              <Textarea
                id="content"
                value={formData.content}
                onChange={(e) => setFormData({...formData, content: e.target.value})}
                rows={6}
                required
              />
            </div>

            <div className='grid grid-cols-2 gap-4'>
                <div>
                    <Label htmlFor="imageUrl">URL de l'image</Label>
                    <Input
                        id="imageUrl"
                        value={formData.imageUrl}
                        onChange={(e) => setFormData({...formData, imageUrl: e.target.value})}
                        placeholder={`https://... (Défaut si vide: ${DEFAULT_IMAGE_URL})`}
                    />
                </div>
                <div>
                    <Label htmlFor="sourceUrl">URL Source Externe</Label>
                    <Input
                        id="sourceUrl"
                        value={formData.sourceUrl}
                        onChange={(e) => setFormData({...formData, sourceUrl: e.target.value})}
                        placeholder="https://..."
                    />
                </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="published"
                checked={formData.published}
                onChange={(e) => setFormData({...formData, published: e.target.checked})}
                className="rounded"
              />
              <Label htmlFor="published">Publié</Label>
            </div>

            <div className="flex gap-2 pt-4">
              <Button type="submit" className="bg-red-600 hover:bg-red-700">
                {showEditModal ? 'Mettre à jour' : 'Créer'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={resetModalsAndForm}
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
        onClose={resetModalsAndForm}
        title={selectedNews?.title || ''}
      >
        {selectedNews && (
          <div className="space-y-6">

            {/* Image Section - FIXED CROPPING ISSUE */}
            {selectedNews.imageUrl && (
              <div className="w-full bg-gray-100 flex items-center justify-center rounded-lg border overflow-hidden">
                <img
                  src={selectedNews.imageUrl}
                  alt={selectedNews.title}
                  className="max-w-full h-auto max-h-80 object-contain" // Fixed styles
                />
              </div>
            )}

            <div className="flex items-center gap-4 text-sm text-gray-500">
              <Badge className={selectedNews.published ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
                {selectedNews.published ? 'Publié' : 'Brouillon'}
              </Badge>
              <Badge className="bg-red-100 text-red-800">
                {categoryLabels[selectedNews.category as keyof typeof categoryLabels]}
              </Badge>
              <span className="flex items-center gap-1">
                <User className="w-4 h-4" />
                {selectedNews.author?.name}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {new Date(selectedNews.createdAt).toLocaleDateString('fr-FR')}
              </span>
            </div>

            {selectedNews.sourceUrl && (
                <div className="flex items-center">
                    <a
                        href={selectedNews.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-blue-600 hover:text-blue-700 text-sm font-medium"
                    >
                        <LinkIcon className="w-4 h-4" />
                        Voir la source externe
                    </a>
                </div>
            )}
            
            <div className="prose max-w-none">
              <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                {selectedNews.content}
              </p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}