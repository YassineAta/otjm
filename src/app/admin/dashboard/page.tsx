'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import {
  Users, FileText, Archive, MessageSquare, LogOut,
  UserCheck, Shield, Eye, Newspaper, Plus, RefreshCw,
} from 'lucide-react'
import { toast } from '@/hooks/use-toast'

interface DashboardStats {
  totalMembers: number
  activeMembers: number
  totalNews: number
  totalArchives: number
  totalContacts: number
  unreadContacts: number
  totalNewsletters: number
  recentMembers: any[]
  recentNews: any[]
  recentContacts: any[]
  recentUsers: any[]
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalMembers: 0, activeMembers: 0, totalNews: 0, totalArchives: 0,
    totalContacts: 0, unreadContacts: 0, totalNewsletters: 0,
    recentMembers: [], recentNews: [], recentContacts: [], recentUsers: [],
  })
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => { fetchDashboardStats() }, [])

  const fetchDashboardStats = async () => {
    try {
      const [membersRes, newsRes, archivesRes, contactsRes, newslettersRes, usersRes] = await Promise.all([
        fetch('/api/membership'), fetch('/api/news'), fetch('/api/archives'),
        fetch('/api/contact'), fetch('/api/newsletter'), fetch('/api/admin/users'),
      ])

      const members = membersRes.ok ? await membersRes.json() : []
      const news = newsRes.ok ? await newsRes.json() : []
      const archives = archivesRes.ok ? await archivesRes.json() : []
      const contacts = contactsRes.ok ? await contactsRes.json() : []
      const newsletters = newslettersRes.ok ? await newslettersRes.json() : []
      const users = usersRes.ok ? await usersRes.json() : []

      setStats({
        totalMembers: members.length,
        activeMembers: members.filter((m: any) => m.status === 'active').length,
        totalNews: news.length,
        totalArchives: archives.length,
        totalContacts: contacts.length,
        unreadContacts: contacts.filter((c: any) => c.status === 'unread').length,
        totalNewsletters: newsletters.length,
        recentMembers: members.slice(0, 5),
        recentNews: news.slice(0, 5),
        recentContacts: contacts.slice(0, 5),
        recentUsers: users.slice(0, 5),
      })
    } catch {
      toast({ title: 'Erreur', description: 'Impossible de charger les statistiques.', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/admin' })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-red-600 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">Chargement...</p>
        </div>
      </div>
    )
  }

  const quickActions = [
    {
      icon: Newspaper, label: 'Actualités', desc: 'Publier un communiqué', href: '/admin/news',
      color: 'text-purple-600', bg: 'bg-purple-50', count: stats.totalNews,
    },
    {
      icon: Archive, label: 'Archives', desc: 'Ajouter un document', href: '/admin/archives',
      color: 'text-orange-600', bg: 'bg-orange-50', count: stats.totalArchives,
    },
    {
      icon: Users, label: 'Membres', desc: 'Gérer les adhésions', href: '/admin/members',
      color: 'text-blue-600', bg: 'bg-blue-50', count: stats.totalMembers,
    },
    {
      icon: Shield, label: 'Administrateurs', desc: 'Comptes admin', href: '/admin/users',
      color: 'text-indigo-600', bg: 'bg-indigo-50', count: stats.recentUsers.length,
    },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <img src="/otjmlogo.jpg" alt="OTJM" className="w-9 h-9 rounded-full" />
              <div>
                <h1 className="text-lg font-bold text-gray-900">OTJM Admin</h1>
                <p className="text-xs text-gray-500">Tableau de bord</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" onClick={() => window.open('/', '_blank')} className="text-gray-600">
                <Eye className="w-3.5 h-3.5 mr-1.5" /> Voir le site
              </Button>
              <Button onClick={handleLogout} variant="ghost" size="sm" className="text-red-600 hover:bg-red-50">
                <LogOut className="w-3.5 h-3.5 mr-1.5" /> Déconnexion
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Stats bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl border p-4">
            <div className="text-2xl font-bold text-gray-900">{stats.totalMembers}</div>
            <div className="text-xs text-gray-500 mt-0.5">Membres total</div>
            <div className="text-xs text-green-600 font-medium mt-1">{stats.activeMembers} actifs</div>
          </div>
          <div className="bg-white rounded-xl border p-4">
            <div className="text-2xl font-bold text-gray-900">{stats.totalNews}</div>
            <div className="text-xs text-gray-500 mt-0.5">Actualités</div>
          </div>
          <div className="bg-white rounded-xl border p-4">
            <div className="text-2xl font-bold text-gray-900">{stats.totalArchives}</div>
            <div className="text-xs text-gray-500 mt-0.5">Archives</div>
          </div>
          <div className="bg-white rounded-xl border p-4">
            <div className="text-2xl font-bold text-gray-900">{stats.unreadContacts}</div>
            <div className="text-xs text-gray-500 mt-0.5">Messages non lus</div>
            <div className="text-xs text-gray-400 mt-1">{stats.totalNewsletters} abonnés newsletter</div>
          </div>
        </div>

        {/* Quick actions — big, clear, icon-forward cards */}
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Actions rapides</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          {quickActions.map((a) => (
            <Card
              key={a.href}
              className="hover:shadow-md transition-shadow cursor-pointer group border-0 shadow-sm"
              onClick={() => router.push(a.href)}
            >
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-11 h-11 rounded-xl ${a.bg} flex items-center justify-center`}>
                    <a.icon className={`w-5 h-5 ${a.color}`} />
                  </div>
                  <span className="text-xs font-bold text-gray-400">{a.count}</span>
                </div>
                <h3 className="font-semibold text-gray-900 group-hover:text-red-600 transition-colors">{a.label}</h3>
                <p className="text-xs text-gray-500 mt-0.5">{a.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Recent activity tabs */}
        <Tabs defaultValue="members">
          <TabsList className="bg-white border mb-4">
            <TabsTrigger value="members">Membres</TabsTrigger>
            <TabsTrigger value="news">Actualités</TabsTrigger>
            <TabsTrigger value="contacts">Messages</TabsTrigger>
          </TabsList>

          <TabsContent value="members">
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Derniers membres</CardTitle>
                  <Button size="sm" variant="outline" onClick={() => router.push('/admin/members')}>Voir tout</Button>
                </div>
              </CardHeader>
              <CardContent>
                {stats.recentMembers.length === 0 ? (
                  <p className="text-gray-400 text-sm text-center py-8">Aucun membre pour le moment</p>
                ) : (
                  <div className="divide-y">
                    {stats.recentMembers.map((m: any) => (
                      <div key={m.id} className="flex items-center justify-between py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-red-50 rounded-full flex items-center justify-center">
                            <UserCheck className="w-4 h-4 text-red-600" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{m.name || 'Sans nom'}</p>
                            <p className="text-xs text-gray-500">{m.email}</p>
                          </div>
                        </div>
                        <Badge variant={m.status === 'active' ? 'default' : 'secondary'} className="text-xs">
                          {m.status === 'active' ? 'Actif' : 'En attente'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="news">
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Dernières actualités</CardTitle>
                  <Button size="sm" variant="outline" onClick={() => router.push('/admin/news')}>
                    <Plus className="w-3.5 h-3.5 mr-1" /> Nouveau
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {stats.recentNews.length === 0 ? (
                  <p className="text-gray-400 text-sm text-center py-8">Aucune actualité pour le moment</p>
                ) : (
                  <div className="divide-y">
                    {stats.recentNews.map((n: any) => (
                      <div key={n.id} className="py-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-900">{n.title}</p>
                            <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{n.excerpt}</p>
                          </div>
                          <Badge variant={n.published ? 'default' : 'secondary'} className="text-xs shrink-0 ml-3">
                            {n.published ? 'Publié' : 'Brouillon'}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="contacts">
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Messages récents</CardTitle>
                  <Badge variant="destructive" className="text-xs">{stats.unreadContacts} non lus</Badge>
                </div>
              </CardHeader>
              <CardContent>
                {stats.recentContacts.length === 0 ? (
                  <p className="text-gray-400 text-sm text-center py-8">Aucun message pour le moment</p>
                ) : (
                  <div className="divide-y">
                    {stats.recentContacts.map((c: any) => (
                      <div key={c.id} className="py-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-900">{c.subject}</p>
                            <p className="text-xs text-gray-500">{c.name} — {c.email}</p>
                            <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{c.message}</p>
                          </div>
                          <Badge variant={c.status === 'unread' ? 'destructive' : 'secondary'} className="text-xs shrink-0 ml-3">
                            {c.status === 'unread' ? 'Non lu' : 'Lu'}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
