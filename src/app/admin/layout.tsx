'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { Sidebar } from '@/components/admin/Sidebar'
import { AdminHeader } from '@/components/admin/AdminHeader'
import { PageLoader } from '@/components/ui/LoadingSpinner'
import { getPendingChanges } from '@/lib/firestore'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { firebaseUser, appUser, loading } = useAuth()
  const router = useRouter()
  const [pendingCount, setPendingCount] = useState(0)

  useEffect(() => {
    if (!loading) {
      if (!firebaseUser) {
        router.replace('/auth/login')
      } else if (appUser && !appUser.isActive) {
        router.replace('/auth/login')
      }
    }
  }, [loading, firebaseUser, appUser, router])

  useEffect(() => {
    if (appUser && (appUser.role === 'ADMIN' || appUser.role === 'DEVELOPER')) {
      getPendingChanges('PENDING').then((changes) => {
        setPendingCount(changes.length)
      }).catch(() => {})
    }
  }, [appUser])

  if (loading) return <PageLoader />
  if (!firebaseUser || !appUser) return <PageLoader />

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar pendingCount={pendingCount} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <AdminHeader pendingCount={pendingCount} />
        <main className="flex-1 overflow-y-auto p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
