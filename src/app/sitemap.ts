import type { MetadataRoute } from 'next'

const SITE_URL = 'https://otjm.org.tn'

// Public, indexable routes only. Admin / setup / membership outcome pages and
// API routes are intentionally excluded. Each route is listed once (the French
// URL) with hreflang alternates pointing at its Arabic (/ar) counterpart, so
// Google discovers and pairs both language versions.
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()
  const routes: { path: string; priority: number; changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency'] }[] = [
    { path: '/', priority: 1.0, changeFrequency: 'weekly' },
    { path: '/news', priority: 0.8, changeFrequency: 'daily' },
    { path: '/archives', priority: 0.6, changeFrequency: 'monthly' },
    { path: '/membership', priority: 0.9, changeFrequency: 'monthly' },
    { path: '/privacy', priority: 0.3, changeFrequency: 'yearly' },
  ]

  const arPath = (path: string) => (path === '/' ? '/ar' : `/ar${path}`)

  return routes.map(({ path, priority, changeFrequency }) => ({
    url: `${SITE_URL}${path}`,
    lastModified: now,
    changeFrequency,
    priority,
    alternates: {
      languages: {
        fr: `${SITE_URL}${path}`,
        ar: `${SITE_URL}${arPath(path)}`,
      },
    },
  }))
}
