import type { Metadata } from 'next'
import { Geist, Geist_Mono, Playfair_Display, Inter, Amiri, Noto_Sans_Arabic } from 'next/font/google'
import './globals.css'
import { Toaster } from '@/components/ui/toaster'
import { LanguageProvider } from '@/lib/i18n'

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] })
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] })
const playfair = Playfair_Display({ subsets: ['latin'], weight: ['700', '900'], style: ['normal', 'italic'], variable: '--font-playfair', display: 'swap' })
const inter = Inter({ subsets: ['latin'], weight: ['400', '500', '600', '700'], variable: '--font-inter', display: 'swap' })
const amiri = Amiri({ subsets: ['arabic', 'latin'], weight: ['400', '700'], style: ['normal', 'italic'], variable: '--font-amiri', display: 'swap' })
const notoArabic = Noto_Sans_Arabic({ subsets: ['arabic'], weight: ['400', '500', '600', '700', '900'], variable: '--font-noto-arabic', display: 'swap' })

const desc = "L'Organisation Tunisienne Des Jeunes Médecins (OTJM) représente et défend les intérêts des jeunes médecins en Tunisie."

export const metadata: Metadata = {
  title: 'Organisation Tunisienne Des Jeunes Médecins',
  description: desc,
  keywords: ['OTJM', 'Jeunes médecins', 'Internes', 'Résidents', 'Tunisie', 'Santé', 'Défense des droits'],
  authors: [{ name: 'Youssef Mahfoudhi' }],
  icons: { icon: '/otjmlogo.jpg' },
  openGraph: { title: 'OTJM', description: desc, url: 'https://otjm.tn/', siteName: 'OTJM', type: 'website' },
  twitter: { card: 'summary_large_image', title: 'OTJM', description: desc },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} ${playfair.variable} ${inter.variable} ${amiri.variable} ${notoArabic.variable} antialiased bg-background text-foreground`}>
        <LanguageProvider>{/* lang/dir on <html> is synced by LanguageProvider itself */}
          <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[9999] focus:bg-[var(--otjm-red)] focus:text-white focus:px-4 focus:py-2 focus:rounded-md focus:text-sm focus:font-semibold">
            Aller au contenu principal
          </a>
          {children}
          <Toaster />
        </LanguageProvider>
      </body>
    </html>
  )
}
