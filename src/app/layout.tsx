import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import { Toaster } from '@/components/ui/toaster'
import { LanguageProvider } from '@/lib/i18n'

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] })
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] })

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
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,700&family=Inter:wght@400;500;600;700&family=Amiri:ital,wght@0,400;0,700;1,400;1,700&family=Noto+Sans+Arabic:wght@400;500;600;700;900&display=swap" />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}>
        <LanguageProvider>
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
