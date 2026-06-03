import { cert, getApps, initializeApp, App, ServiceAccount } from 'firebase-admin/app'
import { getFirestore, Firestore } from 'firebase-admin/firestore'
import { getAuth, Auth } from 'firebase-admin/auth'
import { getStorage, Storage } from 'firebase-admin/storage'

let _app: App | null = null
let _db: Firestore | null = null
let _auth: Auth | null = null
let _storage: Storage | null = null

function initApp(): App {
  if (getApps().length > 0) return getApps()[0]

  const raw = process.env.FIREBASE_SERVICE_ACCOUNT
  if (!raw) throw new Error('FIREBASE_SERVICE_ACCOUNT env var is not set')

  const serviceAccount = JSON.parse(raw) as ServiceAccount

  return initializeApp({
    credential: cert(serviceAccount),
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  })
}

export function getAdminApp(): App {
  if (!_app) _app = initApp()
  return _app
}

export function getAdminDb(): Firestore {
  if (!_db) _db = getFirestore(getAdminApp())
  return _db
}

export function getAdminAuth(): Auth {
  if (!_auth) _auth = getAuth(getAdminApp())
  return _auth
}

export function getAdminStorage(): Storage {
  if (!_storage) _storage = getStorage(getAdminApp())
  return _storage
}
