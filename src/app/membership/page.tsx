'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  GraduationCap,
  Stethoscope,
  Check,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  ArrowRight,
  Users,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SiteHeader } from '@/components/otjm/SiteHeader'
import { SiteFooter } from '@/components/otjm/SiteFooter'
import { MembershipSignupModal, type SignupTier } from '@/components/otjm/MembershipSignupModal'
import { useLanguage } from '@/lib/i18n'

const TIER_KEYS: SignupTier[] = ['externe', 'interne']

const EASE_OUT = [0.22, 1, 0.36, 1] as [number, number, number, number]
const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE_OUT } },
}
const stagger = {
  visible: { transition: { staggerChildren: 0.1 } },
}

const TIER_ICONS = [GraduationCap, Stethoscope]

export default function MembershipPage() {
  const [isDark, setIsDark] = useState(true)
  const [activeStep, setActiveStep] = useState(0)
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const [signupTier, setSignupTier] = useState<SignupTier | null>(null)
  const { t } = useLanguage()
  const m = t.membership

  const openSignup = (idx: number) => setSignupTier(TIER_KEYS[idx] ?? 'externe')
  const activeTierIdx = signupTier ? TIER_KEYS.indexOf(signupTier) : -1
  const activeTier = activeTierIdx >= 0 ? m.tiers[activeTierIdx] : null

  return (
    <div
      className={`min-h-screen font-body ${isDark ? '' : 'light-mode'}`}
      style={{ background: 'var(--otjm-bg)' }}
    >
      <SiteHeader isDark={isDark} onToggleDark={() => setIsDark(!isDark)} />

      <main id="main-content">
        {/* ── Page hero ── */}
        <section className="relative bg-[var(--otjm-dark)] text-white overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-[var(--otjm-red)]" />
          <div className="absolute inset-0 opacity-5">
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: 'radial-gradient(var(--otjm-red) 1px, transparent 1px)',
                backgroundSize: '32px 32px',
              }}
            />
          </div>
          <div className="relative container mx-auto px-4 max-w-6xl py-20">
            <motion.div initial="hidden" animate="visible" variants={stagger} className="max-w-2xl">
              <motion.div variants={fadeUp} className="flex items-center gap-2 mb-4">
                <span className="w-1 h-1 rounded-full bg-[var(--otjm-red)] animate-pulse" />
                <span className="text-white/50 text-xs uppercase tracking-widest font-semibold">
                  {m.eyebrow}
                </span>
              </motion.div>
              <motion.h1
                variants={fadeUp}
                className="font-editorial text-5xl md:text-6xl font-black leading-tight mb-4"
              >
                {m.title}
                <br />
                <span className="text-[var(--otjm-red)]">{m.titleAccent}</span>
              </motion.h1>
              <motion.p
                variants={fadeUp}
                className="text-white/60 text-lg leading-relaxed mb-8 max-w-lg"
              >
                {m.subtitle}
              </motion.p>
              <motion.div variants={fadeUp} className="flex flex-wrap gap-6 text-sm text-white/50">
                <span className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-[var(--otjm-red)]" />
                  {m.stats[0]}
                </span>
                <span className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[var(--otjm-red)]" />
                  {m.stats[1]}
                </span>
                <span className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[var(--otjm-red)]" />
                  {m.stats[2]}
                </span>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* ── Steps ── */}
        <section className="py-20" style={{ background: 'var(--otjm-bg)' }}>
          <div className="container mx-auto px-4 max-w-3xl">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-80px' }}
              variants={stagger}
            >
              <motion.div variants={fadeUp} className="mb-12">
                <span className="text-[var(--otjm-red)] text-xs font-bold uppercase tracking-widest">
                  {m.stepsLabel}
                </span>
                <h2
                  className="font-editorial text-3xl md:text-4xl font-bold mt-2"
                  style={{ color: 'var(--otjm-text)' }}
                >
                  {m.stepsTitle}
                </h2>
              </motion.div>

              <motion.div variants={fadeUp} className="relative">
                <div
                  className="absolute ltr:left-6 rtl:right-6 top-8 bottom-8 w-px"
                  style={{ background: 'var(--otjm-text-muted)', opacity: 0.2 }}
                />
                <motion.div
                  className="absolute ltr:left-6 rtl:right-6 top-8 w-px origin-top bg-[var(--otjm-red)]"
                  animate={{ scaleY: activeStep === 0 ? 0.2 : activeStep === 1 ? 0.55 : 1 }}
                  transition={{ duration: 0.5, ease: EASE_OUT }}
                  style={{ height: 'calc(100% - 4rem)' }}
                />

                <div className="space-y-3">
                  {m.steps.map((step, i) => {
                    const isActive = activeStep === i
                    const isDone = activeStep > i
                    return (
                      <motion.div
                        key={step.num}
                        role="button"
                        tabIndex={0}
                        aria-expanded={isActive}
                        onClick={() => setActiveStep(i)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault()
                            setActiveStep(i)
                          }
                        }}
                        className="relative ltr:pl-16 rtl:pr-16 cursor-pointer"
                        animate={{ opacity: isActive ? 1 : 0.6 }}
                      >
                        <div
                          className="absolute ltr:left-0 rtl:right-0 top-3 w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all duration-300 z-10"
                          style={{
                            borderColor:
                              isActive || isDone
                                ? 'var(--otjm-red)'
                                : isDark
                                  ? 'rgba(255,255,255,0.2)'
                                  : '#E5E1DC',
                            background: isDone
                              ? 'var(--otjm-red)'
                              : isActive
                                ? 'transparent'
                                : 'var(--otjm-bg)',
                            color: isDone
                              ? '#fff'
                              : isActive
                                ? 'var(--otjm-red)'
                                : 'var(--otjm-text-muted)',
                          }}
                        >
                          {isDone ? <Check className="w-4 h-4" /> : step.num}
                        </div>

                        <div
                          className="rounded-xl p-5 border transition-all duration-300"
                          style={{
                            background: isActive
                              ? isDark
                                ? 'rgba(200,16,46,0.08)'
                                : 'rgba(200,16,46,0.05)'
                              : isDark
                                ? 'rgba(255,255,255,0.03)'
                                : 'rgba(0,0,0,0.02)',
                            borderColor: isActive
                              ? 'var(--otjm-red)'
                              : isDark
                                ? 'rgba(255,255,255,0.08)'
                                : '#E5E1DC',
                          }}
                        >
                          <div className="flex items-center justify-between">
                            <h3
                              className="font-semibold text-base"
                              style={{ color: 'var(--otjm-text)' }}
                            >
                              {step.title}
                            </h3>
                            <ChevronDown
                              className="w-4 h-4 transition-transform duration-300"
                              style={{
                                color: 'var(--otjm-text-muted)',
                                transform: isActive ? 'rotate(180deg)' : 'rotate(0deg)',
                              }}
                            />
                          </div>

                          <AnimatePresence>
                            {isActive && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.3, ease: EASE_OUT }}
                                className="overflow-hidden"
                              >
                                <p
                                  className="text-sm leading-relaxed mt-3 mb-4"
                                  style={{ color: 'var(--otjm-text-muted)' }}
                                >
                                  {step.desc}
                                </p>
                                <div className="flex flex-wrap items-center gap-3">
                                  {step.action && (
                                    <a
                                      href={step.action.href}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      onClick={(e) => e.stopPropagation()}
                                      className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--otjm-red)] hover:gap-3 transition-all"
                                    >
                                      {step.action.label}
                                      <ExternalLink className="w-3.5 h-3.5" />
                                    </a>
                                  )}
                                  {i < m.steps.length - 1 && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        setActiveStep(i + 1)
                                      }}
                                      className="inline-flex items-center gap-1 text-sm font-medium hover:gap-2 transition-all"
                                      style={{ color: 'var(--otjm-text-muted)' }}
                                    >
                                      {m.nextStep} <ChevronRight className="w-3.5 h-3.5 rtl-flip" />
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
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* ── Pricing tiers ── */}
        <section
          className="py-16"
          style={{ background: isDark ? 'var(--otjm-ink)' : 'var(--otjm-surface)' }}
        >
          <div className="container mx-auto px-4 max-w-3xl">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-60px' }}
              variants={stagger}
            >
              <motion.div variants={fadeUp} className="mb-10">
                <span className="text-[var(--otjm-red)] text-xs font-bold uppercase tracking-widest">
                  {m.pricingLabel}
                </span>
                <h2
                  className="font-editorial text-3xl font-bold mt-2"
                  style={{ color: 'var(--otjm-text)' }}
                >
                  {m.pricingTitle}
                </h2>
              </motion.div>

              <motion.div variants={fadeUp} className="grid sm:grid-cols-2 gap-5">
                {m.tiers.map((tier, idx) => {
                  const Icon = TIER_ICONS[idx] ?? GraduationCap
                  return (
                    <motion.div
                      key={tier.role}
                      className="relative rounded-2xl p-6 border transition-colors duration-300"
                      style={{
                        background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.9)',
                        backdropFilter: 'blur(8px)',
                        WebkitBackdropFilter: 'blur(8px)',
                        borderColor: isDark ? 'rgba(255,255,255,0.1)' : '#E5E1DC',
                      }}
                      whileHover={{
                        borderColor: 'var(--otjm-red)',
                        boxShadow: '0 0 30px rgba(200,16,46,0.15)',
                      }}
                      transition={{ duration: 0.2 }}
                    >
                      {tier.isPopular && (
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                          <span className="bg-[var(--otjm-red)] text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full">
                            {m.popular}
                          </span>
                        </div>
                      )}

                      <div
                        className="w-11 h-11 rounded-xl flex items-center justify-center mb-4"
                        style={{ background: 'rgba(200,16,46,0.12)' }}
                      >
                        <Icon className="w-5 h-5 text-[var(--otjm-red)]" />
                      </div>

                      <div className="flex items-baseline gap-1 mb-1">
                        <span className="text-3xl font-black" style={{ color: 'var(--otjm-red)' }}>
                          {tier.price}
                        </span>
                        <span className="text-sm font-bold" style={{ color: 'var(--otjm-red)' }}>
                          DT
                        </span>
                        <span className="text-xs ml-1" style={{ color: 'var(--otjm-text-muted)' }}>
                          {m.perYear}
                        </span>
                      </div>
                      <div
                        className="font-semibold text-base mb-1"
                        style={{ color: 'var(--otjm-text)' }}
                      >
                        {tier.role}
                      </div>
                      <div className="text-sm mb-5" style={{ color: 'var(--otjm-text-muted)' }}>
                        {tier.description}
                      </div>

                      <ul className="space-y-2 mb-5">
                        {tier.bullets.map((b) => (
                          <li
                            key={b}
                            className="flex items-center gap-2 text-sm"
                            style={{ color: 'var(--otjm-text-muted)' }}
                          >
                            <Check className="w-3.5 h-3.5 text-[var(--otjm-red)] shrink-0" />
                            {b}
                          </li>
                        ))}
                      </ul>

                      <button
                        type="button"
                        onClick={() => openSignup(idx)}
                        className="flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-lg text-sm font-bold transition-all duration-200 bg-[var(--otjm-red)] text-white hover:bg-[var(--otjm-red-dk)]"
                      >
                        {m.register} <ArrowRight className="w-4 h-4 rtl-flip" />
                      </button>
                    </motion.div>
                  )
                })}
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* ── FAQ ── */}
        <section className="py-16" style={{ background: 'var(--otjm-bg)' }}>
          <div className="container mx-auto px-4 max-w-2xl">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-60px' }}
              variants={stagger}
            >
              <motion.div variants={fadeUp} className="mb-10">
                <span className="text-[var(--otjm-red)] text-xs font-bold uppercase tracking-widest">
                  {m.faqLabel}
                </span>
                <h2
                  className="font-editorial text-3xl font-bold mt-2"
                  style={{ color: 'var(--otjm-text)' }}
                >
                  {m.faqTitle}
                </h2>
              </motion.div>

              <motion.div variants={fadeUp} className="space-y-2">
                {m.faq.map((item, i) => (
                  <div
                    key={i}
                    className="rounded-xl border overflow-hidden transition-colors duration-200"
                    style={{
                      borderColor:
                        openFaq === i
                          ? 'var(--otjm-red)'
                          : isDark
                            ? 'rgba(255,255,255,0.08)'
                            : '#E5E1DC',
                      background: isDark ? 'rgba(255,255,255,0.03)' : '#FFFFFF',
                    }}
                  >
                    <button
                      onClick={() => setOpenFaq(openFaq === i ? null : i)}
                      aria-expanded={openFaq === i}
                      className="w-full flex items-center justify-between px-5 py-4 ltr:text-left rtl:text-right"
                    >
                      <span
                        className="font-semibold text-sm ltr:pr-4 rtl:pl-4"
                        style={{ color: 'var(--otjm-text)' }}
                      >
                        {item.q}
                      </span>
                      <ChevronDown
                        className="w-4 h-4 shrink-0 transition-transform duration-300"
                        style={{
                          color: 'var(--otjm-text-muted)',
                          transform: openFaq === i ? 'rotate(180deg)' : 'rotate(0deg)',
                        }}
                      />
                    </button>
                    <AnimatePresence>
                      {openFaq === i && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.25, ease: EASE_OUT }}
                          className="overflow-hidden"
                        >
                          <p
                            className="px-5 pb-4 text-sm leading-relaxed"
                            style={{ color: 'var(--otjm-text-muted)' }}
                          >
                            {item.a}
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* ── CTA banner ── */}
        <section className="bg-[var(--otjm-red)] text-white py-14">
          <div className="container mx-auto px-4 max-w-6xl text-center">
            <h2 className="font-editorial text-3xl md:text-4xl font-bold mb-3">{m.ctaTitle}</h2>
            <p className="text-white/70 mb-8 max-w-md mx-auto">{m.ctaDesc}</p>
            <button
              type="button"
              onClick={() => openSignup(0)}
              className="inline-flex items-center gap-2 bg-white text-[var(--otjm-red)] font-bold px-8 py-3 rounded-lg hover:bg-white/90 transition-colors"
            >
              {m.ctaBtn} <ArrowRight className="w-4 h-4 rtl-flip" />
            </button>
          </div>
        </section>
      </main>
      <SiteFooter />

      <MembershipSignupModal
        open={signupTier !== null}
        tier={signupTier}
        tierLabel={activeTier?.role ?? ''}
        priceTnd={activeTier ? Number(activeTier.price) : 0}
        onClose={() => setSignupTier(null)}
      />
    </div>
  )
}
