'use client'

import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'

const ALLOWED_ROLES = ['admin', 'superadmin']
const IS_DEV = process.env.NODE_ENV === 'development'

export default function AdminGuard({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()

  // In development: skip auth for easy demo access
  if (IS_DEV) return <>{children}</>

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto" />
          <p className="mt-3 text-sm text-gray-500">Vérification de la session...</p>
        </div>
      </div>
    )
  }

  if (status === 'unauthenticated' || !session?.user) {
    redirect('/admin')
  }

  const role = (session.user as { role?: string }).role
  if (!role || !ALLOWED_ROLES.includes(role)) {
    redirect('/admin')
  }

  return <>{children}</>
}
