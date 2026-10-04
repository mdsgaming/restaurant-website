'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Bell, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '@/contexts/AuthContext'
import { Sidebar } from '@/components/admin/Sidebar'
import { AdminHeader } from '@/components/admin/AdminHeader'
import { PageLoader } from '@/components/ui/LoadingSpinner'
import { getPendingChanges, getRestaurantSettings, saveAdminFcmToken } from '@/lib/firestore'
import { requestPushToken, listenForForegroundMessages } from '@/lib/pushNotifications'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { firebaseUser, appUser, loading } = useAuth()
  const router = useRouter()
  const [pendingCount, setPendingCount] = useState(0)
  const [logoUrl, setLogoUrl] = useState<string | undefined>(undefined)
  const [showNotifyBanner, setShowNotifyBanner] = useState(false)
  const [enablingNotify, setEnablingNotify] = useState(false)
  const notificationSoundUrl = useRef<string>('')
  const soundElRef = useRef<HTMLAudioElement | null>(null)
  const soundUnlockedRef = useRef(false)

  // Plays the new-order sound. Browsers block audio until the page has had a
  // user interaction, so failures are surfaced instead of silently swallowed.
  function playOrderSound() {
    const el = soundElRef.current
    if (!el) return
    el.currentTime = 0
    el.play().catch(() => {
      toast.error('The browser blocked the order sound. Click anywhere on this page once to allow it.')
    })
  }

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
    getRestaurantSettings().then((s) => {
      if (s?.logoUrl) setLogoUrl(s.logoUrl)
      if (s?.orderNotificationSoundUrl) {
        notificationSoundUrl.current = s.orderNotificationSoundUrl
        const el = new Audio(s.orderNotificationSoundUrl)
        el.preload = 'auto'
        soundElRef.current = el
      }
    }).catch(() => {})
  }, [])

  // Unlock audio on the first click or tap anywhere in the admin panel, so
  // later new-order sounds are allowed to play without a user gesture.
  useEffect(() => {
    function unlock() {
      const el = soundElRef.current
      if (!el || soundUnlockedRef.current) return
      soundUnlockedRef.current = true
      el.muted = true
      el.play()
        .then(() => { el.pause(); el.currentTime = 0; el.muted = false })
        .catch(() => { el.muted = false })
    }
    window.addEventListener('pointerdown', unlock)
    return () => window.removeEventListener('pointerdown', unlock)
  }, [])

  // When the admin tab is open but in the background, the service worker
  // receives the push and relays it here, so the sound still plays.
  useEffect(() => {
    if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return
    function onSwMessage(e: MessageEvent) {
      if (e.data?.type === 'FCM_BACKGROUND' && e.data?.data?.orderId) playOrderSound()
    }
    navigator.serviceWorker.addEventListener('message', onSwMessage)
    return () => navigator.serviceWorker.removeEventListener('message', onSwMessage)
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

  // FCM only auto-displays a notification when the tab is backgrounded or
  // closed (via the service worker). When the admin panel is open and
  // focused, the message arrives silently unless we show it ourselves.
  useEffect(() => {
    if (!appUser) return
    if (typeof window === 'undefined' || !('Notification' in window)) return
    if (Notification.permission !== 'granted') return

    let cancelled = false
    let unsubscribe: (() => void) | undefined
    listenForForegroundMessages((payload) => {
      const title = payload.notification?.title || 'Big Treats'
      const body = payload.notification?.body || ''
      toast.success(`${title}${body ? ` — ${body}` : ''}`, { duration: 6000, icon: '🔔' })

      // Play the admin's configured new-order sound, if one is set.
      // Browsers block audio.play() without prior user interaction, which
      // the admin has almost certainly already given just by using the
      // panel — but never let a blocked/failed play() break anything else.
      playOrderSound()

      try {
        const n = new Notification(title, { body, icon: '/icon.png' })
        n.onclick = () => {
          window.focus()
          const url = payload.fcmOptions?.link || payload.data?.url
          if (url) router.push(url)
        }
      } catch {
        // Some browsers block constructing Notification directly while a
        // service worker is registered — the toast above still covers it.
      }
    }).then((unsub) => {
      // Effect may have been cleaned up before the subscription resolved;
      // if so, drop it immediately so listeners never stack up.
      if (cancelled) unsub()
      else unsubscribe = unsub
    })

    return () => {
      cancelled = true
      unsubscribe?.()
    }
  }, [appUser, router])

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
