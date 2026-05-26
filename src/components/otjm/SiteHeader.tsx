'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Sun, Moon, Menu, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { motion, AnimatePresence } from 'framer-motion'
import { useLanguage } from '@/lib/i18n'

const NAV_HREFS = ['/', '/news', '/archives', '/membership'] as const

interface Props {
  isDark?: boolean
  onToggleDark?: () => void
  onSignupClick?: () => void
}

export function SiteHeader({ isDark = true, onToggleDark, onSignupClick }: Props) {
  const [menuOpen, setMenuOpen] = useState(false)
  const pathname = usePathname()
  const { t, lang, setLang } = useLanguage()
  const active = (href: string) => href === '/' ? pathname === '/' : pathname.startsWith(href)

  const navLabels = [t.nav.home, t.nav.news, t.nav.archives, t.nav.membership]

  const toggleLang = () => setLang(lang === 'fr' ? 'ar' : 'fr')

  return (
    <header className="sticky top-0 z-50 bg-[var(--otjm-dark)] border-b border-white/10">
      <div className="container mx-auto px-4 max-w-6xl flex items-center justify-between h-16">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full overflow-hidden ring-2 ring-[var(--otjm-red)] ring-offset-2 ring-offset-[var(--otjm-dark)]">
            <img src="/otjmlogo.jpg" alt="OTJM" className="w-full h-full object-cover" />
          </div>
          <div className="leading-none">
            <span className="text-white font-black text-lg tracking-tight block">OTJM</span>
            <span className="text-white/60 text-[10px] uppercase tracking-widest">Tunisie</span>
          </div>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {NAV_HREFS.map((href, i) => (
            <Link key={href} href={href} aria-current={active(href) ? 'page' : undefined}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${active(href) ? 'text-[var(--otjm-red)] font-semibold' : 'text-white/60 hover:text-white hover:bg-white/5'}`}>
              {navLabels[i]}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <button
            onClick={toggleLang}
            aria-label={`Switch to ${lang === 'fr' ? 'Arabic' : 'French'}`}
            className="hidden md:flex items-center justify-center px-3 h-8 rounded-full text-xs font-bold text-white/70 hover:text-white hover:bg-white/10 transition-colors border border-white/20 hover:border-white/40"
          >
            {t.header.langToggle}
          </button>
          <button onClick={onToggleDark} aria-label={isDark ? t.header.lightMode : t.header.darkMode}
            className="hidden md:flex w-10 h-10 items-center justify-center rounded-full text-white/60 hover:text-white hover:bg-white/10 transition-colors">
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
          {onSignupClick && (
            <Button onClick={onSignupClick} size="sm" className="hidden md:inline-flex font-semibold" style={{ background: 'var(--otjm-red)', color: '#fff' }}>
              {t.header.newsletter}
            </Button>
          )}
          <Button asChild size="sm" className="hidden md:inline-flex bg-white text-[var(--otjm-red)] font-bold hover:bg-white/90">
            <Link href="/membership">{t.header.join}</Link>
          </Button>
          <button
            onClick={toggleLang}
            aria-label={`Switch to ${lang === 'fr' ? 'Arabic' : 'French'}`}
            className="md:hidden flex items-center justify-center w-10 h-10 rounded-full text-xs font-bold text-white/70 hover:text-white hover:bg-white/10 transition-colors border border-white/20"
          >
            {t.header.langToggle}
          </button>
          <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden text-white p-2 rounded-md hover:bg-white/10" aria-label={t.header.menuLabel}>
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {menuOpen && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t border-white/10 bg-[var(--otjm-dark)] overflow-hidden">
            <div className="container mx-auto px-4 py-3 space-y-1">
              {NAV_HREFS.map((href, i) => (
                <Link key={href} href={href} onClick={() => setMenuOpen(false)} aria-current={active(href) ? 'page' : undefined}
                  className={`block px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${active(href) ? 'text-[var(--otjm-red)] font-semibold' : 'text-white/70 hover:text-white hover:bg-white/10'}`}>
                  {navLabels[i]}
                </Link>
              ))}
              <div className="pt-2 pb-1 flex flex-col gap-2">
                <button
                  onClick={() => { toggleLang(); setMenuOpen(false) }}
                  className="w-full text-sm font-bold py-2 px-3 rounded-md border border-white/20 text-white/70 hover:text-white hover:bg-white/10 transition-colors"
                >
                  {t.header.langToggle}
                </button>
                <Button onClick={() => { onToggleDark?.(); setMenuOpen(false) }} size="sm" variant="outline" className="w-full text-white border-white/20 gap-2">
                  {isDark ? <><Sun className="w-4 h-4" /> {t.header.lightMode}</> : <><Moon className="w-4 h-4" /> {t.header.darkMode}</>}
                </Button>
                {onSignupClick && (
                  <Button onClick={() => { onSignupClick(); setMenuOpen(false) }} size="sm" className="w-full font-semibold" style={{ background: 'var(--otjm-red)', color: '#fff' }}>
                    {t.header.newsletter}
                  </Button>
                )}
                <Button asChild className="w-full bg-white text-[var(--otjm-red)] font-bold hover:bg-white/90" size="sm">
                  <Link href="/membership">{t.header.joinFull}</Link>
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
