'use client'

import Link from 'next/link'
import type { ComponentProps } from 'react'
import { useLanguage, localeHref } from '@/lib/i18n'

// Drop-in replacement for next/link that keeps internal navigation inside the
// active locale (prefixes /ar when browsing in Arabic). External, anchor and
// already-prefixed hrefs pass through unchanged. Used so crawlers traversing
// the Arabic site stay on Arabic URLs.
export function LocaleLink({ href, ...props }: ComponentProps<typeof Link>) {
  const { lang } = useLanguage()
  const resolved = typeof href === 'string' ? localeHref(href, lang) : href
  return <Link href={resolved} {...props} />
}
