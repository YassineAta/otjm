'use client'

import { SessionProvider } from 'next-auth/react'
import AdminGuard from '@/components/auth/AdminGuard'

export default function AdminSessionProvider({ children }: { children: React.ReactNode }) {
  if (process.env.NODE_ENV === 'development') return <>{children}</>
  return <SessionProvider><AdminGuard>{children}</AdminGuard></SessionProvider>
}
