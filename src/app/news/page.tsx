'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Search, Calendar, Clock, ArrowRight, ExternalLink,
  ChevronRight, AlertCircle, FileText, RefreshCw,
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { SiteHeader } from '@/components/otjm/SiteHeader'
import { SiteFooter } from '@/components/otjm/SiteFooter'
import { formatDate } from '@/lib/utils'
import { CATEGORIES, type Category } from '@/lib/constants'
import { fadeUp, fadeUpReduced, stagger, staggerReduced } from '@/lib/animations'
import { useReducedMotion } from 'framer-motion'
import { useLanguage } from '@/lib/i18n'

type NewsItem = {
  id: string; title: string; excerpt?: string; content?: string; category?: string
  imageUrl?: string; sourceUrl?: string; published?: boolean; createdAt: string
  author?: { name: string; email: string }
}

type Filter = Category | 'all'
const FILTER_KEYS: Filter[] = ['all', ...Object.keys(CATEGORIES) as Category[]]

function CategoryBadge({ category }: { category?: string }) {
  const { t } = useLanguage()
  const cfg = category ? CATEGORIES[category as Category] : null
  const label = category ? t.categories[category as keyof typeof t.categories] : t.categories.general
  if (!cfg) return <span className="text-xs text-[var(--otjm-text-muted)] uppercase tracking-wider">{label}</span>
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider ${cfg.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {label}
    </span>
  )
}

export default function NewsPage() {
  const [news, setNews] = useState<NewsItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [activeFilter, setActiveFilter] = useState<Filter>('all')
  const [selectedItem, setSelectedItem] = useState<NewsItem | null>(null)
  const [isDark, setIsDark] = useState(true)
  const { t } = useLanguage()
  const [motionMounted, setMotionMounted] = useState(false)
  const _prefersReduced = useReducedMotion()
  const prefersReduced = motionMounted ? _prefersReduced : false

  const loadNews = () => {
    setLoading(true)
    setError(false)
    fetch('/api/news?published=true')
      .then((r) => { if (!r.ok) throw new Error('fetch failed'); return r.json() })
      .then((data) => {
        setNews(Array.isArray(data) ? data : [])
        setLoading(false)
      })
      .catch(() => { setError(true); setLoading(false) })
  }

  useEffect(() => { setMotionMounted(true) }, [])
  useEffect(() => { loadNews() }, [])

  const filtered = news.filter((item) => {
    const matchesCategory = activeFilter === 'all' || item.category === activeFilter
    const q = searchTerm.toLowerCase()
    const matchesSearch = !q || item.title.toLowerCase().includes(q) || item.excerpt?.toLowerCase().includes(q)
    return matchesCategory && matchesSearch
  })

  const featured = filtered[0]
  const rest = filtered.slice(1)

  const counts: Record<string, number> = { all: news.length }
  news.forEach((n) => { if (n.category) counts[n.category] = (counts[n.category] || 0) + 1 })

  const filterLabels: Record<Filter, string> = {
    all: t.news.filterAll,
    protests: t.categories.protests + t.news.filterSuffix,
    statements: t.categories.statements + t.news.filterSuffix,
    announcements: t.categories.announcements + t.news.filterSuffix,
    updates: t.categories.updates + t.news.filterSuffix,
  }

  return (
    <div className={`min-h-screen font-body ${isDark ? '' : 'light-mode'}`} style={{ background: 'var(--otjm-bg)' }}>
      <SiteHeader isDark={isDark} onToggleDark={() => setIsDark(!isDark)} />

      <main id="main-content">
      {/* ── Page hero ── */}
      <section className="relative bg-[var(--otjm-dark)] text-white border-b border-white/10">
        <div className="absolute top-0 left-0 right-0 h-1 bg-[var(--otjm-red)]" />
        <div className="container mx-auto px-4 max-w-6xl py-14">
          <motion.div initial="hidden" animate="visible" variants={stagger}>
            <motion.div variants={fadeUp} className="flex items-center gap-2 mb-3">
              <span className="w-1 h-1 rounded-full bg-[var(--otjm-red)] animate-pulse" />
              <span className="text-white/50 text-xs uppercase tracking-widest font-semibold">{t.news.eyebrow}</span>
            </motion.div>
            <motion.h1 variants={fadeUp} className="font-editorial text-4xl md:text-5xl font-black leading-tight mb-4">
              {t.news.title}
            </motion.h1>
            <motion.p variants={fadeUp} className="text-white/50 max-w-lg">
              {t.news.subtitle}
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* ── Filters + search ── */}
      <div style={{ background: 'var(--otjm-bg)', borderBottom: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid #E5E1DC' }}>
        <div className="container mx-auto px-4 max-w-6xl py-4">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            {/* Category pills */}
            <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1 flex-1">
              {FILTER_KEYS.map((key) => {
                const isActive = activeFilter === key
                const cfg = key !== 'all' ? CATEGORIES[key] : null
                return (
                  <button
                    key={key}
                    onClick={() => setActiveFilter(key)}
                    className="shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all duration-200"
                    style={{
                      background: isActive ? (cfg ? cfg.activeBg : 'rgba(255,255,255,0.12)') : 'transparent',
                      borderColor: isActive ? (cfg ? cfg.hex + 'aa' : 'rgba(255,255,255,0.3)') : isDark ? 'rgba(255,255,255,0.12)' : '#E5E1DC',
                      color: isActive ? (cfg ? cfg.hex : 'var(--otjm-text)') : 'var(--otjm-text-muted)',
                    }}
                  >
                    {cfg && <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${cfg.dot}`} />}
                    {filterLabels[key]}
                    <span
                      className="rounded-full text-[11px] font-bold px-1.5 py-0.5 leading-none"
                      style={{ background: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)', color: 'inherit' }}
                    >
                      {counts[key] || 0}
                    </span>
                  </button>
                )
              })}
            </div>

            {/* Search */}
            <div className="relative shrink-0 w-full sm:w-56">
              <Search className="absolute ltr:left-3 rtl:right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--otjm-text-muted)]" />
              <Input
                aria-label={t.news.searchPlaceholder}
                className="ltr:pl-9 rtl:pr-9 h-8 text-sm border-0 rounded-full"
                style={{
                  backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
                  borderWidth: isDark ? 0 : 1,
                  borderStyle: isDark ? 'none' : 'solid',
                  borderColor: isDark ? 'transparent' : '#E5E1DC',
                  color: 'var(--otjm-text)',
                }}
                placeholder={t.news.searchPlaceholder}
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
            <span className="text-sm">{t.news.loading}</span>
          </div>
        )}

        {error && (
          <div className="flex flex-col items-center gap-4 py-16 text-red-400">
            <AlertCircle className="w-8 h-8" />
            <p className="text-sm">{t.news.error}</p>
            <button
              onClick={loadNews}
              className="flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold border border-red-400/40 hover:border-red-400 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" /> {t.news.retry}
            </button>
          </div>
        )}

        {!loading && !error && filtered.length === 0 && (
          <div className="text-center py-24">
            <FileText className="w-10 h-10 mx-auto mb-4" style={{ color: 'var(--otjm-text-muted)' }} />
            <p className="font-semibold" style={{ color: 'var(--otjm-text)' }}>{t.news.noResults}</p>
            <p className="text-sm mt-1" style={{ color: 'var(--otjm-text-muted)' }}>{t.news.noResultsHint}</p>
          </div>
        )}

        {!loading && !error && filtered.length > 0 && (
          <motion.div initial="hidden" animate="visible" variants={prefersReduced ? staggerReduced : stagger}>
            {/* Featured article */}
            {featured && (
              <motion.article
                variants={prefersReduced ? fadeUpReduced : fadeUp}
                onClick={() => setSelectedItem(featured)}
                className="group cursor-pointer mb-10 grid md:grid-cols-5 gap-0 rounded-2xl overflow-hidden"
                style={{
                  background: 'var(--otjm-card)',
                  border: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid #E5E1DC',
                }}
              >
                {featured.imageUrl && (
                  <div className="md:col-span-2 relative overflow-hidden" style={{ minHeight: 240 }}>
                    <img
                      src={featured.imageUrl}
                      alt={featured.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 absolute inset-0"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent to-[var(--otjm-card)]/30" />
                  </div>
                )}
                <div className={`${featured.imageUrl ? 'md:col-span-3' : 'md:col-span-5'} p-8 flex flex-col justify-between`}>
                  <div>
                    <div className="flex items-center gap-3 mb-4">
                      <CategoryBadge category={featured.category} />
                      <span className="text-xs flex items-center gap-1" style={{ color: 'var(--otjm-text-muted)' }}>
                        <Calendar className="w-3 h-3" />{formatDate(featured.createdAt)}
                      </span>
                    </div>
                    <h2 className="font-editorial text-2xl md:text-3xl font-bold leading-snug mb-3 group-hover:text-[var(--otjm-red)] transition-colors" style={{ color: 'var(--otjm-text)' }}>
                      {featured.title}
                    </h2>
                    {featured.excerpt && (
                      <p className="text-sm leading-relaxed line-clamp-3" style={{ color: 'var(--otjm-text-muted)' }}>
                        {featured.excerpt}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-6 text-sm font-semibold text-[var(--otjm-red)]">
                    {t.news.readArticle} <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform rtl-flip" />
                  </div>
                </div>
              </motion.article>
            )}

            {/* Rest of articles */}
            {rest.length > 0 && (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {rest.map((item) => (
                  <motion.article
                    key={item.id}
                    variants={prefersReduced ? fadeUpReduced : fadeUp}
                    onClick={() => setSelectedItem(item)}
                    className="group cursor-pointer rounded-xl overflow-hidden flex flex-col border transition-shadow duration-300 hover:shadow-lg"
                    style={{
                      background: 'var(--otjm-card)',
                      borderColor: isDark ? 'rgba(255,255,255,0.06)' : '#E5E1DC',
                    }}
                  >
                    {item.imageUrl && (
                      <div className="relative overflow-hidden" style={{ aspectRatio: '16/9' }}>
                        <img
                          src={item.imageUrl}
                          alt={item.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      </div>
                    )}
                    <div className="flex flex-col flex-1 p-5">
                      <CategoryBadge category={item.category} />
                      <h3 className="font-editorial text-lg font-bold mt-2 mb-2 leading-snug line-clamp-3 group-hover:text-[var(--otjm-red)] transition-colors" style={{ color: 'var(--otjm-text)' }}>
                        {item.title}
                      </h3>
                      {item.excerpt && (
                        <p className="text-sm leading-relaxed flex-1 line-clamp-3" style={{ color: 'var(--otjm-text-muted)' }}>
                          {item.excerpt}
                        </p>
                      )}
                      <div className="flex items-center justify-between mt-4 pt-4" style={{ borderTop: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid #E5E1DC' }}>
                        <span className="text-xs flex items-center gap-1" style={{ color: 'var(--otjm-text-muted)' }}>
                          <Clock className="w-3 h-3" />{formatDate(item.createdAt)}
                        </span>
                        <ChevronRight className="w-4 h-4 text-[var(--otjm-red)] opacity-0 group-hover:opacity-100 transition-opacity rtl-flip" />
                      </div>
                    </div>
                  </motion.article>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </div>

      {/* ── Article modal ── */}
      <Dialog open={!!selectedItem} onOpenChange={() => setSelectedItem(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto font-body">
          {selectedItem && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-3 mb-3">
                  <CategoryBadge category={selectedItem.category} />
                  <span className="text-xs flex items-center gap-1 text-muted-foreground">
                    <Calendar className="w-3 h-3" />{formatDate(selectedItem.createdAt)}
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
                {selectedItem.sourceUrl && (
                  <a
                    href={selectedItem.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--otjm-red)] hover:underline"
                  >
                    <ExternalLink className="w-4 h-4" />{t.news.source}
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
