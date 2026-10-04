'use client'

import { getToken, onMessage, type MessagePayload } from 'firebase/messaging'
import { getFcmMessaging } from './firebase'

/**
 * True only when push notifications can actually work right now, in the
 * current tab, with zero extra steps from the person using it.
 *
 * iOS blocks push notifications in every ordinary browser tab (Safari,
 * Chrome, Opera — they all run on the same WebKit engine on iPhone) and
 * only allows it for a site that's been added to the Home Screen and
 * opened from there. We don't ask customers to install anything just to
 * get an order update, so on iOS this returns false unless the page is
 * already running as an installed app — callers should hide push-related
 * UI entirely rather than offer something that silently can't work.
 */
export function canUsePush(): boolean {
  if (typeof window === 'undefined' || !('Notification' in window)) return false

  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !('MSStream' in window)
  if (!isIOS) return true

  const isStandalone =
    window.matchMedia?.('(display-mode: standalone)').matches ||
    (navigator as unknown as { standalone?: boolean }).standalone === true

  return isStandalone
}

/**
 * Requests browser notification permission and returns an FCM device token
 * if granted. Fails silently (returns null) on any unsupported browser,
 * denied permission, or missing VAPID key — callers should treat push as a
 * nice-to-have, never block on it.
 */
/**
 * Shows a notification arriving via Firebase's "foreground" channel.
 *
 * FCM delivers a push two different ways depending on what the browser is
 * doing: if the tab is backgrounded/closed, the service worker's
 * onBackgroundMessage fires and we show a system notification from there.
 * If the tab is open and focused, the browser does NOT invoke the service
 * worker at all — the message arrives in-page via this onMessage listener
 * instead, and nothing is displayed unless the app does it manually. This
 * is why a notification can work perfectly yet never be seen: whoever's
 * looking directly at the admin panel when an order comes in gets no
 * visual cue without this.
 */
export async function listenForForegroundMessages(
  onNotification: (payload: MessagePayload) => void
): Promise<() => void> {
  const messaging = await getFcmMessaging()
  if (!messaging) return () => {}
  return onMessage(messaging, onNotification)
}

export async function requestPushToken(): Promise<string | null> {
  try {
    if (typeof window === 'undefined' || !('Notification' in window)) return null

    const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY
    if (!vapidKey) {
      console.warn('NEXT_PUBLIC_FIREBASE_VAPID_KEY is not set — push notifications unavailable')
      return null
    }

    const permission = await Notification.requestPermission()
    if (permission !== 'granted') return null

    const messaging = await getFcmMessaging()
    if (!messaging) return null

    const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js')
    const token = await getToken(messaging, {
      vapidKey,
      serviceWorkerRegistration: registration,
    })
    return token || null
  } catch (err) {
    console.warn('Push notification setup failed:', err)
    return null
  }
}
