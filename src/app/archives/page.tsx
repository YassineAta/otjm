'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Search, Calendar, ExternalLink, FileText,
  ChevronRight, AlertCircle, RefreshCw, Archive,
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { SiteHeader } from '@/components/otjm/SiteHeader'
import { SiteFooter } from '@/components/otjm/SiteFooter'
import { formatDate } from '@/lib/utils'
import { CATEGORIES } from '@/lib/constants'
import { fadeUp, fadeUpReduced, stagger, staggerReduced } from '@/lib/animations'
import { useReducedMotion } from 'framer-motion'
import { useLanguage } from '@/lib/i18n'

type ArchiveItem = {
  id: string; title: string; excerpt?: string; content?: string; category?: string
  documentType?: string; imageUrl?: string; linkUrl?: string; date?: string; createdAt: string
  author?: { name: string; email: string }
}

const ARCHIVE_CATS: Record<string, { label: string; color: string; hex: string; activeBg: string; dot: string }> = {
  protests:   CATEGORIES.protests,
  statements: CATEGORIES.statements,
  documents:  { label: 'Document', color: 'text-amber-400', hex: '#F59E0B', activeBg: 'rgba(245,158,11,0.12)', dot: 'bg-amber-400' },
}

const YEARS = ['all', '2026', '2025', '2024', '2023', '2022', 'older'] as const

function CategoryBadge({ category }: { category?: string }) {
  const { t } = useLanguage()
  const cfg = category ? ARCHIVE_CATS[category] : null
  const label = category
    ? (t.categories[category as keyof typeof t.categories] ?? category)
    : t.categories.general
  if (!cfg) return <span className="text-xs text-[var(--otjm-text-muted)] uppercase tracking-wider">{label}</span>
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider ${cfg.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {label}
    </span>
  )
}

export default function ArchivesPage() {
  const [archives, setArchives] = useState<ArchiveItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [activeCategory, setActiveCategory] = useState('all')
  const [activeDateFilter, setActiveDateFilter] = useState('all')
  const [selectedItem, setSelectedItem] = useState<ArchiveItem | null>(null)
  const [isDark, setIsDark] = useState(true)
  const { t } = useLanguage()
  const [motionMounted, setMotionMounted] = useState(false)
  const _prefersReduced = useReducedMotion()
  const prefersReduced = motionMounted ? _prefersReduced : false

  const loadArchives = () => {
    setLoading(true)
    setError(false)
    fetch('/api/archives')
      .then((r) => { if (!r.ok) throw new Error('fetch failed'); return r.json() })
      .then((data) => {
        setArchives(Array.isArray(data) ? data : [])
        setLoading(false)
      })
      .catch(() => { setError(true); setLoading(false) })
  }

  useEffect(() => { setMotionMounted(true) }, [])
  useEffect(() => { loadArchives() }, [])

  const filtered = archives.filter((item) => {
    if (activeCategory !== 'all' && item.category !== activeCategory) return false

    if (activeDateFilter !== 'all') {
      const itemDate = new Date(item.date || item.createdAt)
      if (isNaN(itemDate.getTime())) return false
      const year = itemDate.getFullYear()
      if (activeDateFilter === 'older') { if (year >= 2022) return false }
      else if (year.toString() !== activeDateFilter) return false
    }

    const q = searchTerm.toLowerCase()
    if (q && !item.title.toLowerCase().includes(q) && !item.excerpt?.toLowerCase().includes(q)) return false

    return true
  })

  const counts: Record<string, number> = { all: archives.length }
  archives.forEach((a) => { if (a.category) counts[a.category] = (counts[a.category] || 0) + 1 })

  const categoryFilters = [
    { key: 'all', label: t.archives.filterAll },
    ...Object.keys(ARCHIVE_CATS).map((k) => ({
      key: k,
      label: t.categories[k as keyof typeof t.categories] ?? ARCHIVE_CATS[k].label,
    })),
  ]

  const yearLabels: Record<string, string> = {
    all: t.archives.allYears,
    older: t.archives.older,
  }

  return (
    <div className={`min-h-screen font-body ${isDark ? '' : 'light-mode'}`} style={{ background: 'var(--otjm-bg)' }}>
      <SiteHeader isDark={isDark} onToggleDark={() => setIsDark(!isDark)} />

      <main id="main-content">
      {/* ── Page hero ── */}
      <section className="bg-[var(--otjm-dark)] text-white border-b border-white/10">
        <div className="container mx-auto px-4 max-w-6xl py-14">
          <motion.div initial="hidden" animate="visible" variants={stagger}>
            <motion.div variants={fadeUp} className="flex items-center gap-2 mb-3">
              <span className="w-1 h-1 rounded-full bg-[var(--otjm-red)] animate-pulse" />
              <span className="text-white/50 text-xs uppercase tracking-widest font-semibold">{t.archives.eyebrow}</span>
            </motion.div>
            <motion.h1 variants={fadeUp} className="font-editorial text-4xl md:text-5xl font-black leading-tight mb-4">
              {t.archives.title}
            </motion.h1>
            <motion.p variants={fadeUp} className="text-white/50 max-w-lg">
              {t.archives.subtitle}
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* ── Filters ── */}
      <div style={{ background: 'var(--otjm-bg)', borderBottom: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid #E5E1DC' }}>
        <div className="container mx-auto px-4 max-w-6xl py-4">
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap gap-3 items-center">
              {/* Category pills */}
              <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1">
                {categoryFilters.map((f) => {
                  const isActive = activeCategory === f.key
                  const cfg = f.key !== 'all' ? ARCHIVE_CATS[f.key] : null
                  return (
                    <button
                      key={f.key}
                      onClick={() => setActiveCategory(f.key)}
                      className="shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all duration-200"
                      style={{
                        background: isActive ? (cfg ? cfg.activeBg : 'rgba(255,255,255,0.12)') : 'transparent',
                        borderColor: isActive ? (cfg ? cfg.hex + 'aa' : 'rgba(255,255,255,0.3)') : isDark ? 'rgba(255,255,255,0.12)' : '#E5E1DC',
                        color: isActive ? (cfg ? cfg.hex : 'var(--otjm-text)') : 'var(--otjm-text-muted)',
                      }}
                    >
                      {cfg && <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />}
                      {f.label}
                      <span
                        className="rounded-full text-[11px] font-bold px-1.5 py-0.5 leading-none"
                        style={{ background: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)', color: 'inherit' }}
                      >
                        {counts[f.key] || 0}
                      </span>
                    </button>
                  )
                })}
              </div>

              <div className="flex gap-1.5 overflow-x-auto scrollbar-none pb-1">
                {YEARS.map((y) => (
                  <button
                    key={y}
                    onClick={() => setActiveDateFilter(y)}
                    className="shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all duration-200"
                    style={{
                      background: activeDateFilter === y ? 'rgba(255,255,255,0.12)' : 'transparent',
                      borderColor: activeDateFilter === y ? 'rgba(255,255,255,0.3)' : isDark ? 'rgba(255,255,255,0.12)' : '#E5E1DC',
                      color: activeDateFilter === y ? 'var(--otjm-text)' : 'var(--otjm-text-muted)',
                    }}
                  >
                    {yearLabels[y] || y}
                  </button>
                ))}
              </div>
            </div>

            {/* Search */}
            <div className="relative w-full sm:w-72">
              <Search className="absolute ltr:left-3 rtl:right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--otjm-text-muted)]" />
              <Input
                aria-label={t.archives.searchPlaceholder}
                className="ltr:pl-9 rtl:pr-9 h-8 text-sm border-0 rounded-full"
                style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)', borderWidth: isDark ? 0 : 1, borderStyle: isDark ? 'none' : 'solid', borderColor: isDark ? 'transparent' : '#E5E1DC', color: 'var(--otjm-text)' }}
                placeholder={t.archives.searchPlaceholder}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="container mx-auto px-4 max-w-6xl py-12" aria-live="polite">
        {loading && (
          <div className="flex items-center justify-center py-24 gap-3" style={{ color: 'var(--otjm-text-muted)' }}>
            <RefreshCw className="w-5 h-5 animate-spin" />
            <span className="text-sm">{t.archives.loading}</span>
          </div>
        )}

        {error && (
          <div className="flex flex-col items-center gap-4 py-16 text-red-400">
            <AlertCircle className="w-8 h-8" />
            <p className="text-sm">{t.archives.error}</p>
            <button
              onClick={loadArchives}
              className="flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold border border-red-400/40 hover:border-red-400 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" /> {t.archives.retry}
            </button>
          </div>
        )}

        {!loading && !error && filtered.length === 0 && (
          <div className="text-center py-24">
            <Archive className="w-10 h-10 mx-auto mb-4" style={{ color: 'var(--otjm-text-muted)' }} />
            <p className="font-semibold" style={{ color: 'var(--otjm-text)' }}>{t.archives.noResults}</p>
            <p className="text-sm mt-1" style={{ color: 'var(--otjm-text-muted)' }}>{t.archives.noResultsHint}</p>
          </div>
        )}

        {!loading && !error && filtered.length > 0 && (
          <>
            <p className="text-xs mb-6" style={{ color: 'var(--otjm-text-muted)' }}>
              {t.archives.count(filtered.length)}
            </p>

            <motion.div initial="hidden" animate="visible" variants={prefersReduced ? staggerReduced : stagger}>
              <div
                className="rounded-2xl overflow-hidden"
                style={{
                  border: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid #E5E1DC',
                  background: 'var(--otjm-card)',
                }}
              >
                {filtered.map((item, index) => (
                  <motion.article
                    key={item.id}
                    variants={prefersReduced ? fadeUpReduced : fadeUp}
                    onClick={() => setSelectedItem(item)}
                    className="group cursor-pointer flex items-start gap-5 px-6 py-5 transition-colors hover:bg-[var(--otjm-red)]/5"
                    style={{
                      borderBottom: index < filtered.length - 1
                        ? (isDark ? '1px solid rgba(255,255,255,0.05)' : '1px solid #E5E1DC')
                        : 'none',
                    }}
                  >
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                      style={{ background: 'rgba(200,16,46,0.1)' }}
                    >
                      <FileText className="w-4 h-4 text-[var(--otjm-red)]" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <CategoryBadge category={item.category} />
                        {item.documentType && (
                          <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-muted text-muted-foreground">
                            {item.documentType}
                          </span>
                        )}
                      </div>
                      <h3 className="font-semibold text-sm leading-snug mb-1 group-hover:text-[var(--otjm-red)] transition-colors" style={{ color: 'var(--otjm-text)' }}>
                        {item.title}
                      </h3>
                      {item.excerpt && (
                        <p className="text-xs leading-relaxed line-clamp-2" style={{ color: 'var(--otjm-text-muted)' }}>
                          {item.excerpt}
                        </p>
                      )}
                    </div>

                    <div className="shrink-0 flex flex-col items-end gap-2">
                      <span className="text-xs flex items-center gap-1" style={{ color: 'var(--otjm-text-muted)' }}>
                        <Calendar className="w-3 h-3" />
                        {formatDate(item.date || item.createdAt)}
                      </span>
                      <ChevronRight className="w-4 h-4 text-[var(--otjm-red)] opacity-0 group-hover:opacity-100 transition-opacity rtl-flip" />
                    </div>
                  </motion.article>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </div>

      {/* ── Archive detail modal ── */}
      <Dialog open={!!selectedItem} onOpenChange={() => setSelectedItem(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto font-body">
          {selectedItem && (
            <>
              <DialogHeader>
                <div className="flex flex-wrap items-center gap-3 mb-3">
                  <CategoryBadge category={selectedItem.category} />
                  {selectedItem.documentType && (
                    <span className="text-xs font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-muted text-muted-foreground">
                      {selectedItem.documentType}
                    </span>
                  )}
                  <span className="text-xs flex items-center gap-1 text-muted-foreground">
                    <Calendar className="w-3 h-3" />
                    {formatDate(selectedItem.date || selectedItem.createdAt)}
                  </span>
                </div>
                <DialogTitle className="font-editorial text-2xl leading-tight ltr:text-left rtl:text-right">
                  {selectedItem.title}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-2">
                {selectedItem.imageUrl && (
                  <div className="rounded-lg overflow-hidden aspect-video">
                    <img src={selectedItem.imageUrl} alt={selectedItem.title} className="w-full h-full object-cover" />
                  </div>
                )}
                {selectedItem.excerpt && (
                  <p className="text-muted-foreground italic ltr:border-l-4 rtl:border-r-4 border-[var(--otjm-red)] ltr:pl-4 rtl:pr-4 py-1">
                    {selectedItem.excerpt}
                  </p>
                )}
                {selectedItem.content && (
                  <p className="leading-relaxed text-sm whitespace-pre-wrap">{selectedItem.content}</p>
                )}
                {selectedItem.linkUrl && (
                  <a
                    href={selectedItem.linkUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--otjm-red)] hover:underline"
                  >
                    <ExternalLink className="w-4 h-4" />{t.archives.document}
                  </a>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      </main>
      <SiteFooter />
    </div>
  )
}
