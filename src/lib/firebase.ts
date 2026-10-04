import { initializeApp, getApps, type FirebaseApp } from 'firebase/app'
import { getAuth, type Auth } from 'firebase/auth'
import { getFirestore, type Firestore } from 'firebase/firestore'
import { getMessaging, isSupported, type Messaging } from 'firebase/messaging'

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

let _app: FirebaseApp | undefined
let _auth: Auth | undefined
let _db: Firestore | undefined

if (firebaseConfig.apiKey) {
  _app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]
  _auth = getAuth(_app)
  _db = getFirestore(_app)
}

export const app = _app as FirebaseApp
export const auth = _auth as Auth
export const db = _db as Firestore

// Firebase Cloud Messaging only works in a browser with service worker +
// Push API support, so it's resolved lazily and guarded rather than
// initialized eagerly like auth/db above.
let _messaging: Messaging | null = null
export async function getFcmMessaging(): Promise<Messaging | null> {
  if (typeof window === 'undefined' || !_app) return null
  if (_messaging) return _messaging
  try {
    const supported = await isSupported()
    if (!supported) return null
    _messaging = getMessaging(_app)
    return _messaging
  } catch {
    return null
  }
}
