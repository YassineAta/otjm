// src/app/admin/layout.js (Ensure this code is correct)

import AdminSessionProvider from './AdminSessionProvider' // Import the provider created in Step 2

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminSessionProvider>
      {/* This renders the session provider, which in turn renders the AdminGuard */}
      {children}
    </AdminSessionProvider>
  )
}
