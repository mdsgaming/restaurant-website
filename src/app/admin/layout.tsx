'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Bell, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '@/contexts/AuthContext'
import { Sidebar } from '@/components/admin/Sidebar'
import { AdminHeader } from '@/components/admin/AdminHeader'
import { PageLoader } from '@/components/ui/LoadingSpinner'
import { getPendingChanges, getRestaurantSettings, saveAdminFcmToken } from '@/lib/firestore'
import { requestPushToken } from '@/lib/pushNotifications'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { firebaseUser, appUser, loading } = useAuth()
  const router = useRouter()
  const [pendingCount, setPendingCount] = useState(0)
  const [logoUrl, setLogoUrl] = useState<string | undefined>(undefined)
  const [showNotifyBanner, setShowNotifyBanner] = useState(false)
  const [enablingNotify, setEnablingNotify] = useState(false)

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

  useEffect(() => {
    getRestaurantSettings().then((s) => { if (s?.logoUrl) setLogoUrl(s.logoUrl) }).catch(() => {})
  }, [])

  useEffect(() => {
    if (!appUser) return
    if (typeof window === 'undefined' || !('Notification' in window)) return

    if (Notification.permission === 'default') {
      const dismissed = localStorage.getItem('admin-notify-dismissed')
      if (!dismissed) setShowNotifyBanner(true)
      return
    }

    // Permission was already granted in a past visit — silently (re)save a
    // fresh token. This self-heals the case where permission was granted
    // before the VAPID key was configured (or the token save otherwise
    // failed), so a stuck admin doesn't need to find a way to re-trigger
    // the banner manually.
    if (Notification.permission === 'granted') {
      requestPushToken()
        .then((pushToken) => {
          if (pushToken) saveAdminFcmToken(appUser.uid, pushToken).catch(() => {})
        })
        .catch(() => {})
    }
  }, [appUser])

  async function handleEnableNotifications() {
    if (!appUser) return
    setEnablingNotify(true)
    try {
      const pushToken = await requestPushToken()
      if (pushToken) {
        await saveAdminFcmToken(appUser.uid, pushToken)
        setShowNotifyBanner(false)
        toast.success('Notifications enabled')
      } else {
        toast.error('Could not enable notifications — check that notifications are allowed for this site in your browser, then try again.')
      }
    } catch {
      toast.error('Could not enable notifications. Please try again.')
    } finally {
      setEnablingNotify(false)
    }
  }

  function dismissNotifyBanner() {
    localStorage.setItem('admin-notify-dismissed', '1')
    setShowNotifyBanner(false)
  }

  if (loading) return <PageLoader />
  if (!firebaseUser || !appUser) return <PageLoader />

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar pendingCount={pendingCount} logoUrl={logoUrl} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <AdminHeader pendingCount={pendingCount} />
        {showNotifyBanner && (
          <div className="bg-primary/5 border-b border-primary/10 px-6 py-3 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2.5 text-sm text-charcoal/70">
              <Bell className="w-4 h-4 text-primary shrink-0" />
              Enable notifications to get alerted the moment a new order comes in.
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={handleEnableNotifications}
                disabled={enablingNotify}
                className="text-sm font-medium text-primary hover:underline disabled:opacity-50"
              >
                {enablingNotify ? 'Enabling…' : 'Enable Notifications'}
              </button>
              <button type="button" onClick={dismissNotifyBanner} className="text-charcoal/40 hover:text-charcoal">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
        <main className="flex-1 overflow-y-auto p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
