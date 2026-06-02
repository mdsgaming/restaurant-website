import { cert, getApps, initializeApp, App } from 'firebase-admin/app'
import { getFirestore, Firestore } from 'firebase-admin/firestore'
import { getAuth, Auth } from 'firebase-admin/auth'
import { getStorage, Storage } from 'firebase-admin/storage'

let adminApp: App
let adminDb: Firestore
let adminAuth: Auth
let adminStorage: Storage

function getAdminApp(): App {
  if (getApps().length > 0) return getApps()[0]

  const projectId = process.env.FIREBASE_PROJECT_ID
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error('Missing Firebase Admin credentials in environment variables')
  }

  return initializeApp({
    credential: cert({ projectId, clientEmail, privateKey }),
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  })
}

try {
  adminApp = getAdminApp()
  adminDb = getFirestore(adminApp)
  adminAuth = getAuth(adminApp)
  adminStorage = getStorage(adminApp)
} catch (e) {
  console.error('Firebase Admin init error:', e)
  throw e
}

export { adminApp, adminDb, adminAuth, adminStorage }
