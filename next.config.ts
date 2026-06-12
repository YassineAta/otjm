import type { NextConfig } from 'next'

const isDev = process.env.NODE_ENV === 'development'

const nextConfig: NextConfig = {
  output: 'standalone',
  // Pin the tracing root to this project — a stray lockfile in a parent
  // directory otherwise makes Next nest the standalone output wrongly.
  outputFileTracingRoot: __dirname,
  // Card templates/fonts are read with fs at runtime — make sure the
  // standalone output bundles them for the routes that generate cards.
  outputFileTracingIncludes: {
    '/api/payment/**': ['./src/assets/card/**'],
    '/api/membership/**': ['./src/assets/card/**'],
  },
  reactStrictMode: true,
  async headers() {
    return [{
      source: '/(.*)',
      headers: [
        { key: 'X-DNS-Prefetch-Control', value: 'on' },
        { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains; preload' },
        { key: 'X-Frame-Options', value: 'DENY' },
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        {
          key: 'Content-Security-Policy',
          value: [
            "default-src 'self'",
            `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ''}`,
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
            "img-src 'self' blob: data: https:",
            "font-src 'self' https://fonts.gstatic.com",
            "frame-src 'self'",
            "connect-src 'self'",
            "frame-ancestors 'none'",
          ].join('; '),
        },
      ],
    }]
  },
}

export default nextConfig
