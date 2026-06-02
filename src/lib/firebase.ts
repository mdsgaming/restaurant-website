import { initializeApp, getApps, type FirebaseApp } from 'firebase/app'
import { getAuth, type Auth } from 'firebase/auth'
import { getFirestore, type Firestore } from 'firebase/firestore'

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
