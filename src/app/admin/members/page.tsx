'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Modal } from '@/components/ui/modal'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  Users,
  Search,
  Eye,
  Edit,
  Trash2,
  ArrowLeft,
  UserCheck,
  Plus,
  Upload,
  Mail
} from 'lucide-react'
import { toast } from '@/hooks/use-toast'

interface Member {
  id: string
  // CORRECTION: Les champs d'identité sont maintenant au niveau supérieur
  name: string
  email: string
  // FIN CORRECTION
  tier: string
  status: string
  paymentMethod: string
  paymentStatus: string
  startDate: string
  endDate: string
  price: number
  createdAt: string
  cin?: string
  dateOfBirth?: string
  phone?: string
  faculty?: string
  memberStatus?: string
}

const ALL_MEMBER_STATUSES = ['Externe', 'Interne', 'Resident', 'En instance de thèse'];

const PRICE_MAP: {[key: string]: number} = {
    'Externe': 10,
    'Interne': 20,
    'Resident': 20,
    'En instance de thèse': 20,
    'default': 10
};

const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'expired': return 'bg-[var(--otjm-red)]/10 text-[var(--otjm-red-dk)]'
      default: return 'bg-gray-100 text-gray-800'
    }
}

const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'Actif'
      case 'pending': return 'En attente'
      case 'expired': return 'Expiré'
      default: return status
    }
}

const getTierText = (tier: string) => {
    switch (tier) {
      case 'student': return 'Étudiant'
      case 'young-doctor': return 'Jeune Médecin'
      case 'confirmed-doctor': return 'Médecin Confirmé'
      default: return tier
    }
}

const initialAddFormData = {
    fullName: '',
    cin: '',
    dateOfBirth: '',
    email: '',
    phone: '',
    faculty: 'FMT',
    memberStatus: 'Externe',
    tier: 'student',
    paymentStatus: 'pending',
    price: PRICE_MAP['Externe'],
};

export default function MemberManagement() {
  const [members, setMembers] = useState<Member[]>([])
  const [filteredMembers, setFilteredMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [tierFilter, setTierFilter] = useState('all')
  const [showViewModal, setShowViewModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showAddMemberModal, setShowAddMemberModal] = useState(false)
  const [showBulkUploadModal, setShowBulkUploadModal] = useState(false)
  const [selectedMember, setSelectedMember] = useState<Member | null>(null)
  const [editFormData, setEditFormData] = useState({
    status: '',
    paymentStatus: '',
    tier: '',
    memberStatus: '',
    price: 0,
  })
  const [addFormData, setAddFormData] = useState(initialAddFormData)
  const router = useRouter()

  const handleMemberStatusChange = (newStatus: string, updateState: React.Dispatch<React.SetStateAction<any>> = setAddFormData) => {
    const newPrice = PRICE_MAP[newStatus] || PRICE_MAP['default'];

    let newTier = 'student';
    if (newStatus === 'Resident' || newStatus === 'Interne' || newStatus === 'En instance de thèse') {
        newTier = 'young-doctor';
    } else {
        newTier = 'student';
    }

    updateState((prev: typeof initialAddFormData) => ({
        ...prev,
        memberStatus: newStatus,
        price: newPrice,
        tier: newTier,
    }));
  };

  const handleBulkUpload = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const file = formData.get('bulkFile') as File;

    if (!file || file.size === 0) {
        toast({ title: 'Erreur', description: 'Veuillez sélectionner un fichier XLS ou CSV.', variant: 'destructive' });
        return;
    }

    try {
        const response = await fetch('/api/membership/bulk-import', {
            method: 'POST',
            body: formData,
        });

        if (response.ok) {
            const result = await response.json();

            toast({
                title: 'Importation réussie',
                description: `${result.count} membres ajoutés avec succès.`,
            });
            setShowBulkUploadModal(false);
            fetchMembers();
        } else {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Échec de l\'importation côté serveur.');
        }

    } catch (error) {
        toast({
            title: 'Erreur d\'importation',
            description: `Impossible de traiter le fichier. Détails: ${error instanceof Error ? error.message : 'Erreur inconnue'}`,
            variant: 'destructive',
        });
    }
  };


  useEffect(() => {
    fetchMembers()
  }, [])

  useEffect(() => {
    filterMembers()
  }, [members, searchTerm, statusFilter, tierFilter])

  const fetchMembers = async () => {
    try {
      const response = await fetch('/api/membership')
      if (response.ok) {
        const data = await response.json()
        setMembers(data)
      }
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les membres.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  // CORRECTION: Utilise member.name et member.email directement
  const filterMembers = () => {
    let filtered = members

    if (searchTerm) {
      filtered = filtered.filter(member =>
        member.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.email?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(member => member.status === statusFilter)
    }

    if (tierFilter !== 'all') {
      filtered = filtered.filter(member => member.tier === tierFilter)
    }

    setFilteredMembers(filtered)
  }

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();

    const memberData = {
        fullName: addFormData.fullName, cin: addFormData.cin, dateOfBirth: addFormData.dateOfBirth, email: addFormData.email, phone: addFormData.phone, faculty: addFormData.faculty, memberStatus: addFormData.memberStatus, tier: addFormData.tier, paymentStatus: addFormData.paymentStatus, status: addFormData.paymentStatus === 'paid' ? 'active' : 'pending', price: addFormData.price, paymentMethod: 'Manuel/Admin', startDate: new Date().toISOString(), endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString(),
    };

    try {
        const response = await fetch('/api/membership', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', },
            body: JSON.stringify(memberData),
        });

        if (response.ok) {
            toast({ title: 'Succès', description: 'Le nouveau membre a été ajouté manuellement.', });
            setShowAddMemberModal(false);
            setAddFormData(initialAddFormData);
            fetchMembers();
        } else {
            let errorDetails;

            try {
                if (response.headers.get('content-type')?.includes('application/json')) {
                    errorDetails = await response.json();
                } else {
                    const textError = await response.text();
                    throw new Error(`Le serveur a retourné une erreur ${response.status} sans format JSON attendu.`);
                }
            } catch (jsonError) {
                throw new Error(`Le serveur a répondu avec le statut ${response.status}. Impossible de lire la réponse (Probablement une erreur interne du serveur 500).`);
            }

            throw new Error(errorDetails.message || `API responded with status ${response.status}.`);
        }
    } catch (error) {
        toast({
            title: 'Erreur',
            description: `Impossible d'ajouter le membre. Détails: ${error instanceof Error ? error.message : 'Erreur inconnue'}`,
            variant: 'destructive',
        });
    }
  };


  const handleStatusUpdate = async (memberId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/membership/${memberId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus })
      })

      if (response.ok) {
        toast({
          title: 'Succès',
          description: 'Le statut du membre a été mis à jour.',
        })
        fetchMembers()
      } else {
        throw new Error('Failed to update status')
      }
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de mettre à jour le statut du membre.',
        variant: 'destructive',
      })
    }
  }

  const handleView = (member: Member) => {
    setSelectedMember(member)
    setShowViewModal(true)
  }

  const handleEdit = (member: Member) => {
    setSelectedMember(member)
    setEditFormData({
      status: member.status,
      paymentStatus: member.paymentStatus,
      tier: member.tier,
      memberStatus: member.memberStatus || 'Externe',
      price: member.price || 0,
    })
    setShowEditModal(true)
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedMember) return

    const updatedTier = editFormData.memberStatus ? (editFormData.memberStatus === 'Resident' || editFormData.memberStatus === 'Interne' || editFormData.memberStatus === 'En instance de thèse' ? 'young-doctor' : 'student') : editFormData.tier;
    const updatedPrice = editFormData.memberStatus ? (PRICE_MAP[editFormData.memberStatus] || PRICE_MAP['default']) : selectedMember.price;

    const dataToSend = {
      ...editFormData,
      tier: updatedTier,
      price: updatedPrice,
    };

    try {
      const response = await fetch(`/api/membership/${selectedMember.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataToSend)
      })

      if (response.ok) {
        toast({
          title: 'Succès',
          description: 'Le membre a été mis à jour.',
        })
        setShowEditModal(false)
        setSelectedMember(null)
        fetchMembers()
      } else {
        throw new Error('Failed to update member')
      }
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de mettre à jour le membre.',
        variant: 'destructive',
      })
    }
  }

  const handleSendCard = async (memberId: string) => {
    try {
      const response = await fetch(`/api/membership/${memberId}/card`, { method: 'POST' })
      if (response.ok) {
        toast({
          title: 'Succès',
          description: 'La carte de membre a été envoyée par email.',
        })
      } else {
        const body = await response.json().catch(() => null)
        throw new Error(body?.error || 'Failed to send card')
      }
    } catch (error) {
      toast({
        title: 'Erreur',
        description: error instanceof Error ? error.message : "Impossible d'envoyer la carte.",
        variant: 'destructive',
      })
    }
  }

  const handleDelete = async (memberId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce membre?')) {
      return
    }

    try {
      const response = await fetch(`/api/membership/${memberId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast({
          title: 'Succès',
          description: 'Le membre a été supprimé.',
        })
        fetchMembers()
      } else {
        throw new Error('Failed to delete member')
      }
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de supprimer le membre.',
        variant: 'destructive',
      })
    }
  }


  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--otjm-red)] mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement des membres...</p>
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
              <h1 className="text-xl font-bold text-gray-900">Gestion des Membres</h1>
            </div>

            <div className='flex gap-2'>
                 <Button
                    onClick={() => setShowBulkUploadModal(true)}
                    variant="outline"
                    className="border-[var(--otjm-red)] text-[var(--otjm-red)] hover:bg-[var(--otjm-red)]/5"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Importer (Bulk)
                  </Button>
                 <Button
                    onClick={() => setShowAddMemberModal(true)}
                    className="bg-[var(--otjm-red)] hover:bg-[var(--otjm-red-dk)]"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Ajouter un Membre
                  </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--otjm-red)]"
                >
                  <option value="all">Tous les statuts</option>
                  <option value="active">Actif</option>
                  <option value="pending">En attente</option>
                  <option value="expired">Expiré</option>
                </select>
                <select
                  value={tierFilter}
                  onChange={(e) => setTierFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--otjm-red)]"
                >
                  <option value="all">Tous les types</option>
                  <option value="student">Étudiant</option>
                  <option value="young-doctor">Jeune Médecin</option>
                  <option value="confirmed-doctor">Médecin Confirmé</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Liste des Membres ({filteredMembers.length})
            </CardTitle>
            <CardDescription>
              Gérez tous les membres de l'OTJM
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredMembers.length === 0 ? (
              <div className="text-center py-8">
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Aucun membre trouvé</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3 font-medium">Membre</th>
                      <th className="text-left p-3 font-medium">Statut Adhérent</th>
                      <th className="text-left p-3 font-medium">Statut</th>
                      <th className="text-left p-3 font-medium">Paiement</th>
                      <th className="text-left p-3 font-medium">Date d'inscription</th>
                      <th className="text-left p-3 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredMembers.map((member) => (
                      <tr key={member.id} className="border-b hover:bg-gray-50">
                        <td className="p-3">
                          <div>
                            {/* CORRECTION: Accès direct à name et email */}
                            <p className="font-medium">{member.name || 'N/A'}</p>
                            <p className="text-sm text-gray-500">{member.email}</p>
                          </div>
                        </td>
                        <td className="p-3">
                          <Badge variant="outline">
                            {member.memberStatus || getTierText(member.tier)}
                          </Badge>
                        </td>
                        <td className="p-3">
                          <Badge className={getStatusColor(member.status)}>
                            {getStatusText(member.status)}
                          </Badge>
                        </td>
                        <td className="p-3">
                          <div>
                            <p className="text-sm font-medium">{member.price} DT</p>
                            <p className="text-xs text-gray-500">{member.paymentMethod}</p>
                            <Badge
                              variant={member.paymentStatus === 'paid' ? 'default' : 'secondary'}
                              className="mt-1"
                            >
                              {member.paymentStatus === 'paid' ? 'Payé' : 'En attente'}
                            </Badge>
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="text-sm">
                            <p>{new Date(member.startDate).toLocaleDateString('fr-FR')}</p>
                            <p className="text-gray-500">→ {new Date(member.endDate).toLocaleDateString('fr-FR')}</p>
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" onClick={() => handleView(member)}>
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => handleEdit(member)}>
                              <Edit className="w-4 h-4" />
                            </Button>
                            {member.status === 'pending' && (
                              <Button
                                size="sm"
                                onClick={() => handleStatusUpdate(member.id, 'active')}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                <UserCheck className="w-4 h-4" />
                              </Button>
                            )}
                            {member.status === 'active' && member.paymentStatus === 'paid' && (
                              <Button
                                size="sm"
                                variant="outline"
                                title="Envoyer la carte de membre par email"
                                onClick={() => handleSendCard(member.id)}
                              >
                                <Mail className="w-4 h-4" />
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDelete(member.id)}
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


      <Modal
        isOpen={showViewModal}
        onClose={() => setShowViewModal(false)}
        title="Détails du membre"
      >
        {selectedMember && (
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                <Users className="w-8 h-8 text-blue-600" />
              </div>
              <div>
                {/* CORRECTION: Accès direct à name et email */}
                <h3 className="text-xl font-semibold">{selectedMember.name || 'N/A'}</h3>
                <p className="text-gray-500">{selectedMember.email}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b">
                <span className="text-gray-600">Statut de l'adhérent</span>
                <Badge variant="outline">
                  {selectedMember.memberStatus || getTierText(selectedMember.tier)}
                </Badge>
              </div>

              <div className="flex items-center justify-between py-3 border-b">
                <span className="text-gray-600">Statut</span>
                <Badge className={getStatusColor(selectedMember.status)}>
                  {getStatusText(selectedMember.status)}
                </Badge>
              </div>

              <div className="flex items-center justify-between py-3 border-b">
                <span className="text-gray-600">Statut de paiement</span>
                <Badge variant={selectedMember.paymentStatus === 'paid' ? 'default' : 'secondary'}>
                  {selectedMember.paymentStatus === 'paid' ? 'Payé' : 'En attente'}
                </Badge>
              </div>

              <div className="flex items-center justify-between py-3 border-b">
                <span className="text-gray-600">Montant</span>
                <span className="font-medium">{selectedMember.price} DT</span>
              </div>

              <div className="flex items-center justify-between py-3 border-b">
                <span className="text-gray-600">Méthode de paiement</span>
                <span className="font-medium">{selectedMember.paymentMethod}</span>
              </div>

              <div className="flex items-center justify-between py-3 border-b">
                <span className="text-gray-600">Date d'inscription</span>
                <span className="font-medium">
                  {new Date(selectedMember.startDate).toLocaleDateString('fr-FR', {
                    year: 'numeric', month: 'long', day: 'numeric'
                  })}
                </span>
              </div>

              <div className="flex items-center justify-between py-3">
                <span className="text-gray-600">Date d'expiration</span>
                <span className="font-medium">
                  {new Date(selectedMember.endDate).toLocaleDateString('fr-FR', {
                    year: 'numeric', month: 'long', day: 'numeric'
                  })}
                </span>
              </div>
            </div>
          </div>
        )}
      </Modal>

      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Modifier le membre</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4">

             <div>
              <Label htmlFor="edit-memberStatus">Statut de l'adhérent</Label>
              <Select
                value={editFormData.memberStatus}
                onValueChange={(value) => handleMemberStatusChange(value, setEditFormData)}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ALL_MEMBER_STATUSES.map(status => (
                    <SelectItem key={status} value={status}>{status} ({PRICE_MAP[status] || 10} DT)</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className='text-xs text-gray-500 mt-1'>
                Prix auto-calculé: {editFormData.price} DT | Type de base: {getTierText(editFormData.tier)}
              </p>
            </div>

            <div>
              <Label htmlFor="edit-status">Statut</Label>
              <Select value={editFormData.status} onValueChange={(value) => setEditFormData({...editFormData, status: value})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">En attente</SelectItem>
                  <SelectItem value="active">Actif</SelectItem>
                  <SelectItem value="expired">Expiré</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="edit-paymentStatus">Statut de paiement</Label>
              <Select value={editFormData.paymentStatus} onValueChange={(value) => setEditFormData({...editFormData, paymentStatus: value})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">En attente</SelectItem>
                  <SelectItem value="paid">Payé</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <input type="hidden" name="tier" value={editFormData.tier} />
            <input type="hidden" name="price" value={editFormData.price} />


            <div className="flex gap-2 pt-4">
              <Button type="submit" className="bg-[var(--otjm-red)] hover:bg-[var(--otjm-red-dk)]">
                Mettre à jour
              </Button>
              <Button type="button" variant="outline" onClick={() => { setShowEditModal(false); setSelectedMember(null); }}>
                Annuler
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={showBulkUploadModal} onOpenChange={setShowBulkUploadModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className='flex items-center gap-2'>
                <Upload className='w-5 h-5 text-[var(--otjm-red)]' />
                Importer des Membres (Bulk)
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleBulkUpload} className="space-y-6">
            <p className='text-sm text-gray-600'>
                Veuillez télécharger un fichier Excel (.xls, .xlsx) ou CSV contenant les données des membres.
                Assurez-vous que les colonnes correspondent au modèle requis (Nom Complet, CIN, Email, Tél, etc.).
            </p>
            <div>
                <Label htmlFor="bulkFile">Sélectionner le Fichier (.XLS/.CSV) *</Label>
                <Input
                    id="bulkFile" name="bulkFile" type="file" accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                    required className="pt-2"
                />
            </div>
            <div>
                <p className='text-xs text-gray-500'>
                    Vous n'avez pas de modèle?
                    <a href="/templates/member_import_template.xlsx" download className='text-blue-600 hover:underline ml-1'>
                        Télécharger le modèle ici.
                    </a>
                </p>
            </div>
            <div className="flex gap-2 pt-4">
              <Button type="submit" className="bg-green-600 hover:bg-green-700">
                <Upload className="w-4 h-4 mr-2" />
                Importer et Traiter
              </Button>
              <Button type="button" variant="outline" onClick={() => setShowBulkUploadModal(false)}>
                Annuler
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>


      <Dialog open={showAddMemberModal} onOpenChange={setShowAddMemberModal}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Ajouter un Membre Manuellement</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddMember} className="space-y-4">

            <div>
              <Label htmlFor="fullName">Nom et prénom *</Label>
              <Input id="fullName" required
                value={addFormData.fullName}
                onChange={(e) => setAddFormData({...addFormData, fullName: e.target.value})}
              />
            </div>

            <div className='grid grid-cols-2 gap-4'>
                <div>
                  <Label htmlFor="cin">CIN</Label>
                  <Input id="cin"
                    value={addFormData.cin}
                    onChange={(e) => setAddFormData({...addFormData, cin: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="dateOfBirth">Date de naissance *</Label>
                  <Input id="dateOfBirth" type="date" required
                    value={addFormData.dateOfBirth}
                    onChange={(e) => setAddFormData({...addFormData, dateOfBirth: e.target.value})}
                  />
                </div>
            </div>

            <div className='grid grid-cols-2 gap-4'>
                <div>
                  <Label htmlFor="email">E-mail *</Label>
                  <Input id="email" type="email" required
                    value={addFormData.email}
                    onChange={(e) => setAddFormData({...addFormData, email: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="phone">N° de téléphone *</Label>
                  <Input id="phone" type="tel" required
                    value={addFormData.phone}
                    onChange={(e) => setAddFormData({...addFormData, phone: e.target.value})}
                  />
                </div>
            </div>

            <div>
              <Label htmlFor="faculty" className='mb-2 block'>Faculté d'origine *</Label>
              <RadioGroup
                value={addFormData.faculty}
                onValueChange={(value) => setAddFormData({...addFormData, faculty: value})}
                className="flex gap-4"
              >
                <div className="flex items-center space-x-2"><RadioGroupItem value="FMT" id="FMT" /><Label htmlFor="FMT">FMT</Label></div>
                <div className="flex items-center space-x-2"><RadioGroupItem value="FMS" id="FMS" /><Label htmlFor="FMS">FMS</Label></div>
                <div className="flex items-center space-x-2"><RadioGroupItem value="FMM" id="FMM" /><Label htmlFor="FMM">FMM</Label></div>
                <div className="flex items-center space-x-2"><RadioGroupItem value="FMSF" id="FMSF" /><Label htmlFor="FMSF">FMSF</Label></div>
              </RadioGroup>
            </div>

            <div>
              <Label htmlFor="memberStatus" className='mb-2 block'>Statut de l'adhérent *</Label>
              <RadioGroup
                value={addFormData.memberStatus}
                onValueChange={handleMemberStatusChange}
                className="flex flex-col space-y-1"
              >
                {['Externe', 'Interne', 'Resident', 'En instance de thèse'].map(status => (
                    <div key={status} className="flex items-center space-x-2">
                        <RadioGroupItem value={status} id={status} />
                        <Label htmlFor={status}>{status} (<span className='font-semibold text-[var(--otjm-red)]'>{(PRICE_MAP[status] || 20)} DT</span>)</Label>
                    </div>
                ))}
              </RadioGroup>
            </div>

            <div className='grid grid-cols-1'>
                 <div className='col-span-1'>
                    <Label className='font-bold text-lg flex justify-between items-center bg-gray-100 p-2 rounded-md'>
                        <span>Frais d'adhésion:</span>
                        <span className='text-[var(--otjm-red)]'>{addFormData.price} DT</span>
                    </Label>

                    <input type="hidden" name="tier" value={addFormData.tier} />
                    <input type="hidden" name="price" value={addFormData.price} />
                </div>
            </div>

            <div>
              <Label htmlFor="paymentStatus">Statut de Paiement * (Payer ou Non)</Label>
              <Select
                value={addFormData.paymentStatus}
                onValueChange={(value) => setAddFormData({...addFormData, paymentStatus: value})}
                required
              >
                <SelectTrigger className={addFormData.paymentStatus === 'paid' ? 'border-green-500' : 'border-yellow-500'}>
                  <SelectValue placeholder="Sélectionner le statut de paiement" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="paid">Payé (Activer le membre)</SelectItem>
                  <SelectItem value="pending">Non Payé (Laisser en attente)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2 pt-4">
              <Button type="submit" className="bg-[var(--otjm-red)] hover:bg-[var(--otjm-red-dk)]">
                Ajouter le Membre
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowAddMemberModal(false)}
              >
                Annuler
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}