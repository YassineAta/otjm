import type { Metadata } from 'next'
import { headers } from 'next/headers'
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

const SITE_URL = 'https://otjm.org.tn'
const desc = "L'Organisation Tunisienne Des Jeunes Médecins (OTJM) représente et défend les intérêts des jeunes médecins, internes et résidents en Tunisie. Site officiel."

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'OTJM — Organisation Tunisienne Des Jeunes Médecins',
    template: '%s | OTJM',
  },
  description: desc,
  keywords: ['OTJM', 'Organisation Tunisienne des Jeunes Médecins', 'Jeunes médecins', 'Internes', 'Résidents', 'Tunisie', 'Santé', 'Adhésion', 'Défense des droits'],
  authors: [{ name: 'OTJM' }],
  applicationName: 'OTJM',
  // No hard canonical: each URL self-canonicalises. hreflang below declares the
  // FR (root) / AR (/ar) homepage pair; per-page layouts set their own map.
  alternates: {
    languages: { fr: '/', ar: '/ar', 'x-default': '/' },
  },
  icons: { icon: '/otjmlogo.jpg', apple: '/otjmlogo.jpg' },
  openGraph: {
    title: 'OTJM — Organisation Tunisienne Des Jeunes Médecins',
    description: desc,
    url: SITE_URL,
    siteName: 'OTJM',
    locale: 'fr_TN',
    alternateLocale: 'ar_TN',
    type: 'website',
    images: [{ url: '/otjmphoto.jpg', width: 1200, height: 630, alt: 'OTJM — Organisation Tunisienne Des Jeunes Médecins' }],
  },
  twitter: { card: 'summary_large_image', title: 'OTJM', description: desc, images: ['/otjmphoto.jpg'] },
  robots: { index: true, follow: true },
}

const orgJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Organisation Tunisienne Des Jeunes Médecins',
  alternateName: 'OTJM',
  url: SITE_URL,
  logo: `${SITE_URL}/otjmlogo.jpg`,
  description: desc,
  email: 'otjm.national@gmail.com',
  foundingLocation: 'Tunis, Tunisie',
  address: {
    '@type': 'PostalAddress',
    streetAddress: 'Apt A 32, 3e étage, Bardo Palace',
    addressLocality: 'Bardo',
    postalCode: '2000',
    addressCountry: 'TN',
  },
  contactPoint: [{
    '@type': 'ContactPoint',
    telephone: '+216-71-414-095',
    contactType: 'customer service',
    areaServed: 'TN',
    availableLanguage: ['French', 'Arabic'],
  }],
  sameAs: [
    'https://www.facebook.com/people/Organisation-Tunisienne-Des-Jeunes-M%C3%A9decins/61570553852029/',
    'https://www.instagram.com/otjm.national',
  ],
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Locale is resolved by middleware (URL → x-otjm-locale header) so the server
  // emits the correct lang/dir in the initial HTML — no client-side flash, and
  // crawlers see Arabic pages marked lang="ar" dir="rtl".
  const locale = (await headers()).get('x-otjm-locale') === 'ar' ? 'ar' : 'fr'
  const dir = locale === 'ar' ? 'rtl' : 'ltr'
  return (
    <html lang={locale} dir={dir} suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }}
        />
      </head>
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
