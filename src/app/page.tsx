'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence, useInView } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import {
  Menu, X, ArrowRight, ArrowUp, Calendar, ExternalLink,
  MapPin, Phone, Mail, ChevronRight, Facebook, Instagram,
  Users, Clock, Sun, Moon, GraduationCap, Stethoscope, Check, ChevronDown, FileText,
} from 'lucide-react'
import Link from 'next/link'
import { formatDate } from '@/lib/utils'
import { CATEGORIES, type Category } from '@/lib/constants'
import { EASE, fadeUp, fadeUpReduced, stagger, staggerReduced } from '@/lib/animations'
import { useLanguage } from '@/lib/i18n'
import { useReducedMotion } from 'framer-motion'

type NewsItem = {
  id: string; title: string; excerpt: string; content: string
  category: Category; date: string; isFeatured?: boolean; imageUrl?: string; sourceUrl?: string
}

const MOCK_NEWS: NewsItem[] = [
  {
    id: '1',
    title: 'OTJM annonce une grève nationale des jeunes médecins pour le 15 mai',
    excerpt: "Face à l'inaction des autorités sanitaires, l'OTJM appelle à une cessation collective du travail.",
    content: "L'Organisation Tunisienne des Jeunes Médecins annonce une grève nationale pour le 15 mai 2026. Cette décision fait suite à des mois de négociations infructueuses avec le Ministère de la Santé.\n\nL'OTJM exige : une révision urgente de la grille salariale, la régularisation des situations contractuelles, et la mise en place de protocoles de sécurité.",
    category: 'protests', date: '2026-04-15', isFeatured: true, imageUrl: '/otjmlogo.jpg', sourceUrl: 'https://facebook.com/OTJM',
  },
  {
    id: '2', title: 'Déclaration officielle suite à la réunion avec le Ministère de la Santé',
    excerpt: "L'OTJM publie le compte-rendu de sa rencontre avec les responsables du ministère.",
    content: "Suite à la réunion tenue le 10 avril, l'OTJM publie le compte-rendu officiel...",
    category: 'statements', date: '2026-04-10', imageUrl: '/otjmlogo.jpg',
  },
  {
    id: '3', title: 'Ouverture des adhésions 2025–2026 : rejoignez le mouvement',
    excerpt: "La campagne d'adhésion annuelle est officiellement lancée.",
    content: "La campagne d'adhésion 2025–2026 est ouverte. Rejoignez vos confrères...",
    category: 'announcements', date: '2026-04-01', imageUrl: '/otjmlogo.jpg',
  },
  {
    id: '4', title: 'Rapport sur les conditions de travail dans les CHU tunisiens',
    excerpt: "Une enquête auprès de 1 200 jeunes médecins révèle des manquements graves.",
    content: "Le rapport révèle des conditions préoccupantes dans 12 CHU tunisiens...",
    category: 'updates', date: '2026-03-28',
  },
  {
    id: '5', title: 'Communiqué de solidarité avec les internes de Sfax',
    excerpt: "L'OTJM exprime son plein soutien aux internes du CHU de Sfax.",
    content: "L'OTJM exprime son plein soutien aux internes du CHU de Sfax...",
    category: 'statements', date: '2026-03-20',
  },
]

const BADGE_BG: Record<Category, string> = {
  protests: 'border border-red-400/30', statements: 'border border-blue-400/30',
  announcements: 'border border-amber-400/30', updates: 'border border-slate-400/30',
}

const HERO_IMAGES = ['/otjmlogo.jpg', '/otjm.jpg', '/otjmlogo.jpg']

const CATEGORY_COUNTS: Record<string, number> = { all: MOCK_NEWS.length }
MOCK_NEWS.forEach((n) => { CATEGORY_COUNTS[n.category] = (CATEGORY_COUNTS[n.category] || 0) + 1 })

const sectionVariants = stagger
const charVariant = { hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0 } }
const typewriterContainer = { hidden: {}, visible: { transition: { staggerChildren: 0.035, delayChildren: 0.3 } } }

function SectionReveal({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })
  return (
    <motion.div ref={ref} initial="hidden" animate={inView ? 'visible' : 'hidden'} variants={sectionVariants} className={className}>
      {children}
    </motion.div>
  )
}

function CategoryBadge({ category }: { category: Category }) {
  const { t } = useLanguage()
  const c = CATEGORIES[category]
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wider px-2 py-0.5 rounded ${BADGE_BG[category]} ${c.color}`}>
      {t.categories[category]}
    </span>
  )
}

function CountUp({ end, suffix = '', duration = 1500 }: { end: number; suffix?: string; duration?: number }) {
  const [count, setCount] = useState(0)
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })

  useEffect(() => {
    if (!inView) return
    const start = performance.now()
    const ease = (t: number) => 1 - Math.pow(1 - t, 3)
    let rafId: number
    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1)
      setCount(Math.round(ease(t) * end))
      if (t < 1) rafId = requestAnimationFrame(tick)
    }
    rafId = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafId)
  }, [inView, end, duration])

  return <span ref={ref}>{count.toLocaleString('fr-FR')}{suffix}</span>
}

function FeaturedCard({ item, onClick }: { item: NewsItem; onClick: () => void }) {
  const { t } = useLanguage()
  return (
    <motion.article variants={fadeUp} onClick={onClick}
      className="group cursor-pointer col-span-2 relative overflow-hidden rounded-xl bg-[var(--otjm-ink)] text-white" style={{ minHeight: 420 }}>
      <div className="absolute inset-0">
        <img src={item.imageUrl || '/otjmlogo.jpg'} alt={item.title} loading="lazy" className="w-full h-full object-cover opacity-30 group-hover:opacity-40 transition-opacity duration-500" />
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--otjm-ink)] via-[var(--otjm-ink)]/60 to-transparent" />
      </div>
      <div className="absolute top-4 ltr:left-4 rtl:right-4">
        <span className="flex items-center gap-1.5 bg-[var(--otjm-red)] text-white text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full">
          <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />{t.home.liveLabel}
        </span>
      </div>
      <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
        <CategoryBadge category={item.category} />
        <h2 className="font-editorial text-2xl md:text-3xl font-bold mt-3 mb-3 leading-tight group-hover:text-[var(--otjm-red)] transition-colors">{item.title}</h2>
        <p className="text-white/70 text-sm leading-relaxed mb-4 line-clamp-2 max-w-xl">{item.excerpt}</p>
        <div className="flex items-center justify-between">
          <span className="text-xs text-white/50 flex items-center gap-1"><Clock className="w-3 h-3" />{formatDate(item.date)}</span>
          <span className="flex items-center gap-1 text-sm font-semibold text-[var(--otjm-red)] group-hover:gap-2 transition-all">{t.home.readArticle} <ArrowRight className="w-4 h-4 rtl-flip" /></span>
        </div>
      </div>
    </motion.article>
  )
}

function NewsCard({ item, onClick }: { item: NewsItem; onClick: () => void }) {
  return (
    <motion.article variants={fadeUp} onClick={onClick}
      className="group cursor-pointer flex flex-col border border-[var(--otjm-border)] rounded-xl overflow-hidden hover:shadow-md transition-shadow duration-300"
      style={{ background: 'var(--otjm-card)' }}>
      {item.imageUrl && (
        <div className="relative overflow-hidden" style={{ aspectRatio: '16/9' }}>
          <img src={item.imageUrl} alt={item.title} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        </div>
      )}
      <div className="flex flex-col flex-1 p-5">
        <CategoryBadge category={item.category} />
        <h3 className="font-editorial text-lg font-bold mt-2 mb-2 leading-snug group-hover:text-[var(--otjm-red)] transition-colors line-clamp-3" style={{ color: 'var(--otjm-text)' }}>{item.title}</h3>
        <p className="text-sm leading-relaxed flex-1 line-clamp-3" style={{ color: 'var(--otjm-text-muted)' }}>{item.excerpt}</p>
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-[var(--otjm-border)]">
          <span className="text-xs flex items-center gap-1" style={{ color: 'var(--otjm-text-muted)' }}><Calendar className="w-3 h-3" />{formatDate(item.date)}</span>
          <ArrowRight className="w-4 h-4 text-[var(--otjm-red)] opacity-0 group-hover:opacity-100 transition-opacity rtl-flip" />
        </div>
      </div>
    </motion.article>
  )
}

function CompactCard({ item, onClick }: { item: NewsItem; onClick: () => void }) {
  const { t } = useLanguage()
  const c = CATEGORIES[item.category]
  return (
    <motion.article onClick={onClick} className="group cursor-pointer flex items-center gap-4 py-3 px-4"
      whileHover={{ x: 4 }} transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      style={{ borderInlineStart: `3px solid ${c.hex}` }}>
      <div className="flex-1 min-w-0">
        <span className={`text-[10px] font-bold uppercase tracking-wider ${c.color}`}>{t.categories[item.category]}</span>
        <h4 className="font-semibold text-sm mt-0.5 leading-snug line-clamp-2 group-hover:text-[var(--otjm-red)] transition-colors text-[var(--otjm-text)]">{item.title}</h4>
        <span className="text-xs mt-1 flex items-center gap-1 text-[var(--otjm-text-muted)]">
          <Clock className="w-3 h-3" />{formatDate(item.date)}
        </span>
      </div>
      <ChevronRight className="w-4 h-4 shrink-0 group-hover:text-[var(--otjm-red)] transition-colors text-[var(--otjm-text-muted)] rtl-flip" />
    </motion.article>
  )
}

function MembershipSection({ isDark }: { isDark: boolean }) {
  const [activeStep, setActiveStep] = useState(0)
  const { t } = useLanguage()

  const tiers = t.membership.tiers
  const steps = t.membership.steps

  return (
    <section id="membership" className="py-24" style={{ background: 'var(--otjm-bg)' }}>
      <div className="container mx-auto px-4 max-w-6xl">
        <SectionReveal>
          <motion.div variants={fadeUp} className="mb-14">
            <span className="text-[var(--otjm-red)] text-sm font-bold uppercase tracking-widest">{t.home.membershipLabel}</span>
            <h2 className="font-editorial text-4xl md:text-5xl font-bold mt-2 mb-4 leading-tight" style={{ color: 'var(--otjm-text)' }}>
              {t.home.membershipTitle}
            </h2>
            <p className="max-w-xl text-lg leading-relaxed" style={{ color: 'var(--otjm-text-muted)' }}>
              {t.home.membershipDesc}
            </p>
          </motion.div>

          <motion.div variants={fadeUp} className="mb-16">
            <div className="flex items-center gap-4 mb-8">
              <div className="h-px flex-1" style={{ background: 'var(--otjm-text-muted)', opacity: 0.2 }} />
              <span className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--otjm-text-muted)' }}>{t.home.howToJoin}</span>
              <div className="h-px flex-1" style={{ background: 'var(--otjm-text-muted)', opacity: 0.2 }} />
            </div>

            <div className="relative max-w-2xl">
              <div className="absolute ltr:left-6 rtl:right-6 top-8 bottom-8 w-px" style={{ background: 'var(--otjm-text-muted)', opacity: 0.2 }} />
              <motion.div className="absolute ltr:left-6 rtl:right-6 top-8 w-px origin-top bg-[var(--otjm-red)]"
                animate={{ scaleY: activeStep === 0 ? 0.2 : activeStep === 1 ? 0.55 : 1 }}
                transition={{ duration: 0.5, ease: EASE }} style={{ height: 'calc(100% - 4rem)' }} />

              <div className="space-y-3">
                {steps.map((step, i) => {
                  const isActive = activeStep === i
                  const isDone = activeStep > i
                  return (
                    <motion.div key={step.num} role="button" tabIndex={0} aria-expanded={isActive}
                      onClick={() => setActiveStep(i)}
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setActiveStep(i) } }}
                      className="relative ltr:pl-16 rtl:pr-16 cursor-pointer" animate={{ opacity: isActive ? 1 : 0.65 }}>
                      <div className="absolute ltr:left-0 rtl:right-0 top-3 w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all duration-300 z-10"
                        style={{
                          borderColor: isActive || isDone ? 'var(--otjm-red)' : isDark ? 'rgba(255,255,255,0.2)' : '#E5E1DC',
                          background: isDone ? 'var(--otjm-red)' : 'var(--otjm-bg)',
                          color: isDone ? '#fff' : isActive ? 'var(--otjm-red)' : 'var(--otjm-text-muted)',
                        }}>
                        {isDone ? <Check className="w-4 h-4" /> : step.num}
                      </div>
                      <div className="rounded-xl p-5 border transition-all duration-300" style={{
                        background: isActive ? (isDark ? 'rgba(200,16,46,0.08)' : 'rgba(200,16,46,0.05)') : (isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)'),
                        borderColor: isActive ? 'var(--otjm-red)' : isDark ? 'rgba(255,255,255,0.08)' : '#E5E1DC',
                      }}>
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold text-base" style={{ color: 'var(--otjm-text)' }}>{step.title}</h3>
                          <ChevronDown className="w-4 h-4 transition-transform duration-300"
                            style={{ color: 'var(--otjm-text-muted)', transform: isActive ? 'rotate(180deg)' : 'rotate(0deg)' }} />
                        </div>
                        <AnimatePresence>
                          {isActive && (
                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                              transition={{ duration: 0.3, ease: EASE }} className="overflow-hidden">
                              <p className="text-sm leading-relaxed mt-3 mb-4" style={{ color: 'var(--otjm-text-muted)' }}>{step.desc}</p>
                              <div className="flex flex-wrap items-center gap-3">
                                {step.action && (
                                  <a href={step.action.href} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}
                                    className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--otjm-red)] hover:gap-3 transition-all">
                                    {step.action.label} <ExternalLink className="w-3.5 h-3.5" />
                                  </a>
                                )}
                                {i < steps.length - 1 && (
                                  <button onClick={(e) => { e.stopPropagation(); setActiveStep(i + 1) }}
                                    className="inline-flex items-center gap-1 text-sm font-medium hover:gap-2 transition-all" style={{ color: 'var(--otjm-text-muted)' }}>
                                    {t.home.nextStep} <ChevronRight className="w-3.5 h-3.5 rtl-flip" />
                                  </button>
                                )}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            </div>
          </motion.div>

          <motion.div variants={fadeUp} className="grid sm:grid-cols-2 gap-5 max-w-2xl">
            {tiers.map((tier, tierIdx) => {
              const Icon = [GraduationCap, Stethoscope][tierIdx] ?? Stethoscope
              return (
                <motion.div key={tier.role} className="relative rounded-2xl p-6 border transition-colors duration-300 group"
                  style={{
                    background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.9)',
                    backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
                    borderColor: isDark ? 'rgba(255,255,255,0.1)' : '#E5E1DC',
                  }}
                  whileHover={{ borderColor: 'var(--otjm-red)', boxShadow: '0 0 30px rgba(200,16,46,0.15)' }} transition={{ duration: 0.2 }}>
                  {tier.isPopular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="bg-[var(--otjm-red)] text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full">{t.home.mostPopular}</span>
                    </div>
                  )}
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4" style={{ background: 'rgba(200,16,46,0.12)' }}>
                    <Icon className="w-5 h-5 text-[var(--otjm-red)]" />
                  </div>
                  <div className="flex items-baseline gap-1 mb-1">
                    <span className="text-3xl font-black" style={{ color: 'var(--otjm-red)' }}>{tier.price}</span>
                    <span className="text-sm" style={{ color: 'var(--otjm-text-muted)' }}>{t.home.perYear}</span>
                  </div>
                  <div className="font-semibold text-base mb-1" style={{ color: 'var(--otjm-text)' }}>{tier.role}</div>
                  <div className="text-sm mb-5" style={{ color: 'var(--otjm-text-muted)' }}>{tier.description}</div>
                  <ul className="space-y-2 mb-5">
                    {tier.bullets.map((b) => (
                      <li key={b} className="flex items-center gap-2 text-sm" style={{ color: 'var(--otjm-text-muted)' }}>
                        <Check className="w-3.5 h-3.5 text-[var(--otjm-red)] shrink-0" />{b}
                      </li>
                    ))}
                  </ul>
                  <Link href="/membership"
                    className="flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-lg text-sm font-bold transition-all duration-200 bg-[var(--otjm-red)] text-white hover:bg-[var(--otjm-red-dk)]">
                    {t.home.joinTier} <ArrowRight className="w-4 h-4 rtl-flip" />
                  </Link>
                </motion.div>
              )
            })}
          </motion.div>
        </SectionReveal>
      </div>
    </section>
  )
}

function NewsModal({ item, open, onClose }: { item: NewsItem | null; open: boolean; onClose: () => void }) {
  const { t } = useLanguage()
  if (!item) return null
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto font-body">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <CategoryBadge category={item.category} />
            <span className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="w-3 h-3" />{formatDate(item.date)}</span>
          </div>
          <DialogTitle className="font-editorial text-2xl leading-tight ltr:text-left rtl:text-right">{item.title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          {item.imageUrl && <div className="rounded-lg overflow-hidden aspect-video"><img src={item.imageUrl} alt={item.title} loading="lazy" className="w-full h-full object-cover" /></div>}
          <p className="text-muted-foreground italic ltr:border-l-4 rtl:border-r-4 border-[var(--otjm-red)] ltr:pl-4 rtl:pr-4 py-1">{item.excerpt}</p>
          <p className="leading-relaxed whitespace-pre-wrap text-sm">{item.content}</p>
          {item.sourceUrl && (
            <a href={item.sourceUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--otjm-red)] hover:underline">
              <ExternalLink className="w-4 h-4" />{t.home.viewSource}
            </a>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

function SignupModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [step, setStep] = useState<'form' | 'success'>('form')
  const [submitting, setSubmitting] = useState(false)
  const [consentChecked, setConsentChecked] = useState(false)
  const { t } = useLanguage()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!consentChecked) return
    setSubmitting(true)
    const form = e.target as HTMLFormElement
    const email = (form.elements.namedItem('email') as HTMLInputElement)?.value
    try { await fetch('/api/newsletter', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) }) } catch {}
    setSubmitting(false)
    setStep('success')
  }

  return (
    <Dialog open={open} onOpenChange={() => { setStep('form'); setConsentChecked(false); onClose() }}>
      <DialogContent className="max-w-md font-body">
        <AnimatePresence mode="wait">
          {step === 'form' ? (
            <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <DialogHeader>
                <span className="text-[var(--otjm-red)] text-xs font-bold uppercase tracking-widest">{t.header.newsletter}</span>
                <DialogTitle className="font-editorial text-2xl leading-tight ltr:text-left rtl:text-right">{t.home.newsletterTitle}</DialogTitle>
                <p className="text-sm text-muted-foreground mt-1">{t.home.newsletterDesc}</p>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="mt-4 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="text-xs font-medium text-foreground mb-1 block">{t.home.firstNameLabel}</label><Input required /></div>
                  <div><label className="text-xs font-medium text-foreground mb-1 block">{t.home.lastNameLabel}</label><Input required /></div>
                </div>
                <div><label className="text-xs font-medium text-foreground mb-1 block">{t.home.emailLabel}</label><Input type="email" name="email" placeholder="amine@chu-tunis.tn" required /></div>
                <div>
                  <label className="text-xs font-medium text-foreground mb-1 block">{t.home.statusLabel}</label>
                  <select className="w-full border rounded-md px-3 py-2 text-sm text-foreground bg-background focus:outline-none focus:ring-2 focus:ring-[var(--otjm-red)]">
                    <option value="">{t.home.selectStatus}</option>
                    {t.home.statuses.map((s) => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div className="flex items-start gap-2.5 pt-1">
                  <input
                    id="newsletter-consent"
                    type="checkbox"
                    checked={consentChecked}
                    onChange={(e) => setConsentChecked(e.target.checked)}
                    className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer accent-[var(--otjm-red)]"
                  />
                  <label htmlFor="newsletter-consent" className="text-xs text-muted-foreground cursor-pointer leading-relaxed">
                    {t.home.newsletterConsentPre}
                    <Link href="/privacy" target="_blank" className="underline underline-offset-2 hover:text-[var(--otjm-red)] transition-colors" onClick={(e) => e.stopPropagation()}>
                      {t.home.newsletterConsentLink}
                    </Link>
                    {t.home.newsletterConsentPost}
                  </label>
                </div>
                <Button type="submit" disabled={submitting || !consentChecked} className="w-full mt-1 font-semibold" style={{ background: 'var(--otjm-red)', color: '#fff' }}>
                  {submitting ? t.home.subscribing : t.home.subscribe}
                </Button>
                <p className="text-xs text-muted-foreground text-center">{t.home.noSpam}</p>
              </form>
            </motion.div>
          ) : (
            <motion.div key="success" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-8">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 300, damping: 15, delay: 0.1 }}>✓</motion.div>
              </div>
              <h3 className="font-editorial text-xl font-bold mb-2">{t.home.successTitle}</h3>
              <p className="text-sm text-muted-foreground">{t.home.successDesc}</p>
              <Button onClick={() => { setStep('form'); onClose() }} variant="outline" className="mt-6">{t.home.close}</Button>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  )
}

export default function OTJMHome() {
  const [isDark, setIsDark] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [activeSection, setActiveSection] = useState('accueil')
  const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null)
  const [showNewsModal, setShowNewsModal] = useState(false)
  const [showSignupModal, setShowSignupModal] = useState(false)
  const [newsFilter, setNewsFilter] = useState<Category | 'all'>('all')
  const [tickerPaused, setTickerPaused] = useState(false)
  const [currentSlide, setCurrentSlide] = useState(0)
  const [showScrollTop, setShowScrollTop] = useState(false)
  const { t, lang, setLang } = useLanguage()
  const [motionMounted, setMotionMounted] = useState(false)
  const _prefersReduced = useReducedMotion()
  const prefersReduced = motionMounted ? _prefersReduced : false
  const toggleLang = () => setLang(lang === 'fr' ? 'ar' : 'fr')

  const navItems = [
    { id: 'accueil',    label: t.nav.home,       href: undefined },
    { id: 'actualites', label: t.nav.news,        href: '/news' },
    { id: 'membership', label: t.nav.membership,  href: '/membership' },
    { id: 'contact',    label: t.footer.contact,  href: undefined },
  ]

  const headlineParts = [
    { text: t.home.headlineNormal, red: false },
    { text: t.home.headlineAccent, red: true },
    { text: t.home.headlineDot,    red: false },
  ]

  useEffect(() => { setMotionMounted(true) }, [])

  useEffect(() => {
    const id = setInterval(() => setCurrentSlide((s) => (s + 1) % HERO_IMAGES.length), 5000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    const onScroll = () => setShowScrollTop(window.scrollY > 400)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const observers: IntersectionObserver[] = []
    ;['accueil', 'actualites', 'membership', 'contact'].forEach((id) => {
      const el = document.getElementById(id)
      if (!el) return
      const obs = new IntersectionObserver(
        ([entry]) => { if (entry.isIntersecting) setActiveSection((prev) => prev === id ? prev : id) },
        { threshold: 0.3 }
      )
      obs.observe(el)
      observers.push(obs)
    })
    return () => observers.forEach((o) => o.disconnect())
  }, [])

  const handleNavClick = (id: string) => {
    setMobileMenuOpen(false)
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
  }

  const filteredNews = newsFilter === 'all' ? MOCK_NEWS : MOCK_NEWS.filter((n) => n.category === newsFilter)
  const featuredItem = filteredNews.find((n) => n.isFeatured) ?? filteredNews[0]
  const rest = filteredNews.filter((n) => n !== featuredItem)
  const sidebarItems = rest.slice(0, 2)
  const gridItems = rest.slice(2)


  return (
    <div className={`min-h-screen font-body ${isDark ? '' : 'light-mode'}`} style={{ background: 'var(--otjm-bg)' }}>

      <div className="bg-[var(--otjm-red)] text-white text-xs font-semibold py-1.5 overflow-hidden cursor-pointer"
        onMouseEnter={() => setTickerPaused(true)} onMouseLeave={() => setTickerPaused(false)} style={{ userSelect: 'none' }}>
        <div className="flex items-center relative">
          <span className="shrink-0 bg-white text-[var(--otjm-red)] px-3 py-0.5 uppercase tracking-widest text-xs font-black relative z-10">Flash</span>
          <div className="absolute left-[4.5rem] top-0 bottom-0 w-6 z-[5] pointer-events-none" style={{ background: 'linear-gradient(to right, var(--otjm-red), transparent)' }} />
          <motion.div className="flex gap-16 whitespace-nowrap ml-4"
            animate={{ x: tickerPaused ? undefined : ['0%', '-50%'] }}
            transition={{ duration: 30, repeat: Infinity, ease: 'linear', repeatType: 'loop' }}>
            {[...Array(2)].flatMap((_, i) => MOCK_NEWS.map((n) => (
              <span key={`${i}-${n.id}`} className="flex items-center gap-2">
                <span className="w-1 h-1 rounded-full bg-white/60" />{n.title}
              </span>
            )))}
          </motion.div>
        </div>
      </div>

      <header className="sticky top-0 z-50 bg-[var(--otjm-dark)] border-b border-white/10">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="flex items-center justify-between h-16">
            <button onClick={() => handleNavClick('accueil')} className="flex items-center gap-3 group">
              <div className="w-9 h-9 rounded-full overflow-hidden ring-2 ring-[var(--otjm-red)] ring-offset-2 ring-offset-[var(--otjm-dark)]">
                <img src="/otjmlogo.jpg" alt="OTJM" className="w-full h-full object-cover" />
              </div>
              <div className="leading-none">
                <span className="text-white font-black text-lg tracking-tight block">OTJM</span>
                <span className="text-white/60 text-[10px] uppercase tracking-widest">Tunisie</span>
              </div>
            </button>

            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => {
                const cls = `px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeSection === item.id ? 'text-[var(--otjm-red)] font-semibold' : 'text-white/60 hover:text-white hover:bg-white/5'
                }`
                return item.href ? (
                  <Link key={item.id} href={item.href} className={cls}>{item.label}</Link>
                ) : (
                  <button key={item.id} onClick={() => handleNavClick(item.id)} className={cls}>{item.label}</button>
                )
              })}
            </nav>

            <div className="flex items-center gap-2">
              <button onClick={toggleLang}
                aria-label={`Switch to ${lang === 'fr' ? 'Arabic' : 'French'}`}
                className="hidden md:flex items-center justify-center px-3 h-8 rounded-full text-xs font-bold text-white/70 hover:text-white border border-white/20 hover:border-white/40 transition-colors">
                {t.header.langToggle}
              </button>
              <button id="theme-toggle" onClick={() => setIsDark(!isDark)}
                aria-label={isDark ? t.home.lightMode : t.home.darkMode}
                className="hidden md:flex w-10 h-10 items-center justify-center rounded-full text-white/60 hover:text-white hover:bg-white/10 transition-colors">
                {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
              <Button onClick={() => setShowSignupModal(true)} size="sm" className="hidden md:inline-flex font-semibold" style={{ background: 'var(--otjm-red)', color: '#fff' }}>
                {t.header.newsletter}
              </Button>
              <Button asChild size="sm" className="hidden md:inline-flex bg-white text-[var(--otjm-red)] font-bold hover:bg-white/90">
                <Link href="/membership">{t.header.join}</Link>
              </Button>
              <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden text-white p-2 rounded-md hover:bg-white/10 transition-colors" aria-label={t.home.menuLabel}>
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
              className="md:hidden border-t border-white/10 bg-[var(--otjm-dark)] overflow-hidden">
              <div className="container mx-auto px-4 py-3 space-y-1">
                {navItems.map((item) => {
                  const cls = `block w-full text-left px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                    activeSection === item.id ? 'text-[var(--otjm-red)] font-semibold' : 'text-white/70 hover:text-white hover:bg-white/10'
                  }`
                  return item.href ? (
                    <Link key={item.id} href={item.href} onClick={() => setMobileMenuOpen(false)} className={cls}>{item.label}</Link>
                  ) : (
                    <button key={item.id} onClick={() => handleNavClick(item.id)} className={cls}>{item.label}</button>
                  )
                })}
                <div className="pt-2 pb-1 flex flex-col gap-2">
                  <Button onClick={() => { toggleLang(); setMobileMenuOpen(false) }} size="sm" variant="outline" className="w-full text-white border-white/20 font-bold">
                    {t.header.langToggle}
                  </Button>
                  <Button onClick={() => { setIsDark(!isDark); setMobileMenuOpen(false) }} size="sm" variant="outline" className="w-full text-white border-white/20 gap-2">
                    {isDark ? <><Sun className="w-4 h-4" /> {t.home.lightMode}</> : <><Moon className="w-4 h-4" /> {t.home.darkMode}</>}
                  </Button>
                  <Button onClick={() => { setShowSignupModal(true); setMobileMenuOpen(false) }} size="sm" className="w-full font-semibold" style={{ background: 'var(--otjm-red)', color: '#fff' }}>
                    {t.header.newsletter}
                  </Button>
                  <Button asChild className="w-full bg-white text-[var(--otjm-red)] font-bold hover:bg-white/90" size="sm">
                    <Link href="/membership">{t.header.joinFull}</Link>
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <div id="main-content" />
      <section id="accueil" className="relative overflow-hidden bg-[var(--otjm-dark)] text-white">
        <div className="absolute inset-0">
          <AnimatePresence mode="wait">
            <motion.div key={currentSlide} className="absolute inset-0"
              initial={{ opacity: 0, scale: 1.05 }} animate={{ opacity: 1, scale: 1.05 }} exit={{ opacity: 0 }}
              transition={{ duration: 1.2, ease: 'easeInOut' }}>
              <motion.img src={HERO_IMAGES[currentSlide]} alt="" className="w-full h-full object-cover opacity-20"
                animate={{ scale: [1.05, 1.1] }} transition={{ duration: 5, ease: 'linear' }} />
            </motion.div>
          </AnimatePresence>
          <div className="absolute inset-0 bg-gradient-to-b from-[var(--otjm-dark)]/80 via-[var(--otjm-dark)]/60 to-[var(--otjm-dark)]" />
        </div>
        <div className="absolute top-0 left-0 right-0 h-1 bg-[var(--otjm-red)]" />
        <div className="relative container mx-auto px-4 max-w-6xl py-20 md:py-32">
          <motion.div key={lang} initial="hidden" animate="visible" variants={sectionVariants} className="max-w-3xl">
            <motion.div variants={fadeUp} className="flex items-center gap-2 mb-6">
              <span className="w-1 h-1 rounded-full bg-[var(--otjm-red)] animate-pulse" />
              <span className="text-white/50 text-xs uppercase tracking-widest font-semibold">{t.home.eyebrow}</span>
            </motion.div>
            <motion.h1 key={lang} variants={typewriterContainer} initial="hidden" animate="visible"
              className="font-editorial text-5xl md:text-6xl lg:text-7xl font-black leading-[1.05] mb-6">
              {headlineParts.map((part, pi) =>
                part.text.split(/(\s+)/).map((token, ti) =>
                  /^\s+$/.test(token) ? (
                    <span key={`${pi}-${ti}`} style={{ display: 'inline', whiteSpace: 'pre' }}>{token}</span>
                  ) : (
                    <span key={`${pi}-${ti}`} style={{ display: 'inline-block', whiteSpace: 'nowrap' }}>
                      {token.split('').map((char, ci) => (
                        <motion.span key={`${pi}-${ti}-${ci}`} variants={charVariant} transition={{ duration: 0.3, ease: EASE }}
                          className={part.red ? 'text-[var(--otjm-red)]' : ''}
                          style={{ display: 'inline' }}>
                          {char}
                        </motion.span>
                      ))}
                    </span>
                  )
                )
              )}
            </motion.h1>
            <motion.p variants={prefersReduced ? fadeUpReduced : fadeUp} className="text-white/60 text-lg md:text-xl leading-relaxed mb-10 max-w-xl">
              {t.home.heroDesc}
            </motion.p>
            <motion.div variants={prefersReduced ? fadeUpReduced : fadeUp} className="flex flex-wrap gap-3">
              <Button onClick={() => handleNavClick('actualites')} size="lg" className="font-semibold gap-2" style={{ background: 'var(--otjm-red)', color: '#fff' }}>
                {t.home.latestNews} <ArrowRight className="w-4 h-4 rtl-flip" />
              </Button>
              <Button onClick={() => handleNavClick('membership')} size="lg" variant="outline" className="font-semibold text-white border-white/30 hover:bg-white/10 bg-transparent">
                {t.home.joinOtjm}
              </Button>
            </motion.div>
            <motion.div variants={prefersReduced ? fadeUpReduced : fadeUp} className="flex flex-wrap gap-8 mt-16 pt-8 border-t border-white/10">
              {[
                { end: 1200, suffix: '+', label: t.home.statLabels[0] },
                { end: 12, suffix: '', label: t.home.statLabels[1] },
                { end: 2025, suffix: '', label: t.home.statLabels[2] },
              ].map((stat) => (
                <div key={stat.label}>
                  <div className="text-2xl font-black text-white"><CountUp end={stat.end} suffix={stat.suffix} /></div>
                  <div className="text-xs text-white/60 uppercase tracking-wider mt-0.5">{stat.label}</div>
                </div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      <section id="actualites" className="py-20" style={{ background: 'var(--otjm-bg)' }}>
        <div className="container mx-auto px-4 max-w-6xl">
          <SectionReveal>
            <motion.div variants={fadeUp} className="flex items-end justify-between mb-10">
              <div>
                <span className="text-[var(--otjm-red)] text-xs font-bold uppercase tracking-widest">{t.home.newsSectionLabel}</span>
                <h2 className="font-editorial text-3xl md:text-4xl font-bold mt-1" style={{ color: 'var(--otjm-text)' }}>{t.home.newsSectionTitle}</h2>
              </div>
              <Link href="/archives" className="hidden md:flex items-center gap-1 text-sm font-medium text-[var(--otjm-muted)] hover:text-[var(--otjm-red)] transition-colors">
                {t.home.viewArchives} <ChevronRight className="w-4 h-4 rtl-flip" />
              </Link>
            </motion.div>

            <motion.div variants={fadeUp} className="relative mb-8">
              <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1">
                {(['all', 'protests', 'statements', 'announcements', 'updates'] as const).map((f) => {
                  const isActive = newsFilter === f
                  const cfg = f !== 'all' ? CATEGORIES[f as Category] : null
                  const count = CATEGORY_COUNTS[f] || 0
                  return (
                    <button key={f} onClick={() => setNewsFilter(f)}
                      className="relative shrink-0 flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold border transition-all duration-200"
                      style={{
                        background: isActive ? (cfg ? cfg.activeBg : (isDark ? 'rgba(255,255,255,0.12)' : 'rgba(26,29,39,0.1)')) : 'transparent',
                        borderColor: isActive ? (cfg ? cfg.hex + 'aa' : (isDark ? 'rgba(255,255,255,0.3)' : 'rgba(26,29,39,0.3)')) : (isDark ? 'rgba(255,255,255,0.12)' : '#E5E1DC'),
                        color: isActive ? (cfg ? cfg.hex : (isDark ? '#fff' : 'var(--otjm-ink)')) : (isDark ? 'rgba(255,255,255,0.5)' : 'var(--otjm-muted)'),
                      }}>
                      {cfg && <span className={`w-2 h-2 rounded-full shrink-0 ${cfg.dot}`} />}
                      <span>{f === 'all' ? t.home.filterAll : t.categories[f as Category]}</span>
                      <span className="rounded-full text-[10px] font-bold px-1.5 py-0.5 leading-none"
                        style={{ background: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)', color: isActive ? (isDark ? '#fff' : 'inherit') : (isDark ? 'rgba(255,255,255,0.5)' : 'var(--otjm-muted)') }}>
                        {count}
                      </span>
                    </button>
                  )
                })}
              </div>
            </motion.div>
          </SectionReveal>

          <AnimatePresence mode="wait">
            {filteredNews.length === 0 ? (
              <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="py-16 text-center" style={{ color: 'var(--otjm-text-muted)' }}>
                {t.home.noFilter}
              </motion.div>
            ) : newsFilter === 'all' ? (
              <motion.div key="all" initial="hidden" animate="visible" variants={stagger}>
                <div className="grid md:grid-cols-3 gap-5 mb-8">
                  {featuredItem && <FeaturedCard item={featuredItem} onClick={() => { setSelectedNews(featuredItem); setShowNewsModal(true) }} />}
                  <div className="flex flex-col gap-5">
                    {sidebarItems.map((item) => (
                      <NewsCard key={item.id} item={item} onClick={() => { setSelectedNews(item); setShowNewsModal(true) }} />
                    ))}
                  </div>
                </div>
                {gridItems.length > 0 && (
                  <div>
                    <div className="flex items-center gap-4 mb-4">
                      <div className="h-px flex-1" style={{ background: isDark ? 'rgba(255,255,255,0.1)' : '#E5E1DC' }} />
                      <span className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--otjm-text-muted)' }}>{t.home.moreRecent}</span>
                      <div className="h-px flex-1" style={{ background: isDark ? 'rgba(255,255,255,0.1)' : '#E5E1DC' }} />
                    </div>
                    <div className="rounded-xl overflow-hidden" style={{
                      background: isDark ? 'var(--otjm-ink)' : 'var(--otjm-surface)',
                      border: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid #E5E1DC',
                    }}>
                      {gridItems.map((item) => (
                        <CompactCard key={item.id} item={item} onClick={() => { setSelectedNews(item); setShowNewsModal(true) }} />
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.div key={newsFilter} initial="hidden" animate="visible" variants={stagger}
                className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredNews.map((item) => (
                  <NewsCard key={item.id} item={item} onClick={() => { setSelectedNews(item); setShowNewsModal(true) }} />
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

      <section className="bg-[var(--otjm-red)] text-white py-16">
        <div className="container mx-auto px-4 max-w-6xl">
          <SectionReveal>
            <div className="flex flex-col md:flex-row items-center justify-between gap-8">
              <motion.div variants={prefersReduced ? fadeUpReduced : fadeUp} className="max-w-xl">
                <div className="flex items-center gap-2 mb-3">
                  <Users className="w-5 h-5 text-white/70" />
                  <span className="text-white/70 text-sm font-semibold uppercase tracking-widest">{t.home.ctaBannerLabel}</span>
                </div>
                <h2 className="font-editorial text-3xl md:text-4xl font-bold leading-tight mb-3">{t.home.ctaBannerTitle}<br />{t.home.ctaBannerTitle2}</h2>
                <p className="text-white/70 leading-relaxed">{t.home.ctaBannerDesc}</p>
              </motion.div>
              <div className="flex flex-col sm:flex-row gap-3 shrink-0">
                <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                  transition={{ duration: 0.5, ease: EASE }} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                  <Button onClick={() => handleNavClick('membership')} size="lg" className="bg-white font-bold hover:bg-white/90" style={{ color: 'var(--otjm-red)' }}>
                    {t.home.ctaJoinNow}
                  </Button>
                </motion.div>
                <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                  transition={{ delay: 0.15, duration: 0.5, ease: EASE }} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                  <Button onClick={() => setShowSignupModal(true)} size="lg" variant="outline" className="border-white/40 text-white hover:bg-white/10 font-semibold bg-transparent">
                    {t.header.newsletter}
                  </Button>
                </motion.div>
              </div>
            </div>
          </SectionReveal>
        </div>
      </section>

      <MembershipSection isDark={isDark} />

      <footer id="contact" className="bg-[var(--otjm-ink)] text-white">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="grid md:grid-cols-3 gap-12 py-16">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full overflow-hidden ring-2 ring-[var(--otjm-red)]">
                  <img src="/otjmlogo.jpg" alt="OTJM" loading="lazy" className="w-full h-full object-cover" />
                </div>
                <div>
                  <div className="font-black text-lg">OTJM</div>
                  <div className="text-white/60 text-[10px] uppercase tracking-widest">Tunisie</div>
                </div>
              </div>
              <p className="text-white/50 text-sm leading-relaxed mb-6">{t.home.footerOrgDesc}</p>
              <div className="flex gap-3">
                <a href="https://www.facebook.com/people/Organisation-Tunisienne-Des-Jeunes-M%C3%A9decins/61570553852029/" target="_blank" rel="noopener noreferrer"
                  className="w-9 h-9 rounded-full border border-white/20 flex items-center justify-center hover:border-[var(--otjm-red)] hover:text-[var(--otjm-red)] transition-colors" aria-label="Facebook">
                  <Facebook className="w-4 h-4" />
                </a>
                <a href="https://www.instagram.com/otjm.national" target="_blank" rel="noopener noreferrer"
                  className="w-9 h-9 rounded-full border border-white/20 flex items-center justify-center hover:border-[var(--otjm-red)] hover:text-[var(--otjm-red)] transition-colors" aria-label="Instagram">
                  <Instagram className="w-4 h-4" />
                </a>
              </div>
            </div>
            <div>
              <h3 className="text-xs font-bold uppercase tracking-widest text-white/60 mb-5">{t.home.footerNavTitle}</h3>
              <ul className="space-y-3">
                {navItems.map((item) => (
                  <li key={item.id}>
                    {item.href ? (
                      <Link href={item.href} className="text-white/60 hover:text-white text-sm transition-colors">{item.label}</Link>
                    ) : (
                      <button onClick={() => handleNavClick(item.id)} className="text-white/60 hover:text-white text-sm transition-colors">{item.label}</button>
                    )}
                  </li>
                ))}
                <li><Link href="/archives" className="text-white/60 hover:text-white text-sm transition-colors">{t.home.archivesLink}</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-xs font-bold uppercase tracking-widest text-white/60 mb-5">{t.home.footerContactTitle}</h3>
              <div className="space-y-3">
                <div className="flex items-start gap-2 text-sm text-white/60">
                  <MapPin className="w-4 h-4 mt-0.5 shrink-0 text-[var(--otjm-red)]" />
                  <span>Rue 9 avril, Bab Saadoun, Tunis 1002</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-white/60">
                  <Phone className="w-4 h-4 shrink-0 text-[var(--otjm-red)]" />
                  <a href="tel:+21658998045" className="hover:text-white transition-colors">+216 58 998 045</a>
                </div>
                <div className="flex items-center gap-2 text-sm text-white/60">
                  <Mail className="w-4 h-4 shrink-0 text-[var(--otjm-red)]" />
                  <a href="mailto:otjm.national@gmail.com" className="hover:text-white transition-colors">otjm.national@gmail.com</a>
                </div>
              </div>
              <div className="mt-6 p-4 border border-white/10 rounded-xl">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[var(--otjm-red)] mb-1">
                  <FileText className="w-3 h-3" />{t.home.footerPress}
                </div>
                <p className="text-white/50 text-xs leading-relaxed">{t.home.footerPressDesc}</p>
              </div>
            </div>
          </div>
          <div className="border-t border-white/10 py-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-white/50">
            <span>{t.home.footerCopyright}</span>
            <span>{t.home.footerRights}</span>
          </div>
        </div>
      </footer>

      <NewsModal item={selectedNews} open={showNewsModal} onClose={() => setShowNewsModal(false)} />
      <SignupModal open={showSignupModal} onClose={() => setShowSignupModal(false)} />

      <AnimatePresence>
        {showScrollTop && (
          <motion.button
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 16 }}
            transition={{ duration: 0.25, ease: EASE }}
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            aria-label={lang === 'ar' ? 'العودة إلى الأعلى' : 'Retour en haut'}
            className="fixed bottom-6 right-6 z-50 w-11 h-11 rounded-full flex items-center justify-center shadow-lg border border-white/10 hover:scale-110 transition-transform"
            style={{ background: 'var(--otjm-red)', color: '#fff' }}>
            <ArrowUp className="w-5 h-5" />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  )
}
