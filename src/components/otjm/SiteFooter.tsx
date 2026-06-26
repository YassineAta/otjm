'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Facebook, Instagram, MapPin, Phone, Mail, FileText } from 'lucide-react'
import { useLanguage } from '@/lib/i18n'

const NAV_HREFS = ['/', '/news', '/archives', '/membership'] as const

export function SiteFooter() {
  const { t } = useLanguage()
  const navLabels = [t.nav.home, t.nav.news, t.nav.archives, t.nav.membership]

  return (
    <footer className="bg-[var(--otjm-ink)] text-white">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="grid md:grid-cols-3 gap-12 py-16">

          {/* Brand */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full overflow-hidden ring-2 ring-[var(--otjm-red)]">
                <Image src="/otjmlogo.jpg" alt="OTJM" width={80} height={80} className="w-full h-full object-cover" />
              </div>
              <div>
                <div className="font-black text-lg">OTJM</div>
                <div className="text-white/60 text-[10px] uppercase tracking-widest">Tunisie</div>
              </div>
            </div>
            <p className="text-white/50 text-sm leading-relaxed mb-6">{t.footer.tagline}</p>
            <div className="flex gap-3">
              <a
                href="https://www.facebook.com/people/Organisation-Tunisienne-Des-Jeunes-M%C3%A9decins/61570553852029/"
                target="_blank" rel="noopener noreferrer" aria-label="Facebook"
                className="w-9 h-9 rounded-full border border-white/20 flex items-center justify-center hover:border-[var(--otjm-red)] hover:text-[var(--otjm-red)] transition-colors"
              >
                <Facebook className="w-4 h-4" />
              </a>
              <a
                href="https://www.instagram.com/otjm.national"
                target="_blank" rel="noopener noreferrer" aria-label="Instagram"
                className="w-9 h-9 rounded-full border border-white/20 flex items-center justify-center hover:border-[var(--otjm-red)] hover:text-[var(--otjm-red)] transition-colors"
              >
                <Instagram className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Navigation */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest text-white/60 mb-5">{t.footer.navigation}</h3>
            <ul className="space-y-3">
              {NAV_HREFS.map((href, i) => (
                <li key={href}>
                  <Link href={href} className="text-white/60 hover:text-white text-sm transition-colors">
                    {navLabels[i]}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest text-white/60 mb-5">{t.footer.contact}</h3>
            <div className="space-y-3">
              <div className="flex items-start gap-2 text-sm text-white/60">
                <MapPin className="w-4 h-4 mt-0.5 shrink-0 text-[var(--otjm-red)]" />
                <span>{t.footer.address}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-white/60">
                <Phone className="w-4 h-4 shrink-0 text-[var(--otjm-red)]" />
                <a href="tel:+21671414095" className="hover:text-white transition-colors">+216 71 414 095</a>
                <span className="text-white/30">/</span>
                <a href="tel:+21698655883" className="hover:text-white transition-colors">+216 98 655 883</a>
              </div>
              <div className="flex items-center gap-2 text-sm text-white/60">
                <Mail className="w-4 h-4 shrink-0 text-[var(--otjm-red)]" />
                <a href="mailto:otjm.national@gmail.com" className="hover:text-white transition-colors">otjm.national@gmail.com</a>
              </div>
            </div>
            <div className="mt-6 p-4 border border-white/10 rounded-xl">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[var(--otjm-red)] mb-1">
                <FileText className="w-3 h-3" />{t.footer.press}
              </div>
              <p className="text-white/50 text-xs leading-relaxed">{t.footer.pressDesc}</p>
            </div>
          </div>
        </div>

        <div className="border-t border-white/10 py-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-white/50">
          <span>{t.footer.copyright}</span>
          <div className="flex items-center gap-5">
            <Link href="/privacy" className="hover:text-white transition-colors">{t.footer.privacy}</Link>
            <span>{t.footer.rights}</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
