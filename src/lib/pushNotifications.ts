'use client'

import { getToken } from 'firebase/messaging'
import { getFcmMessaging } from './firebase'

/**
 * Requests browser notification permission and returns an FCM device token
 * if granted. Fails silently (returns null) on any unsupported browser,
 * denied permission, or missing VAPID key — callers should treat push as a
 * nice-to-have, never block on it.
 */
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
