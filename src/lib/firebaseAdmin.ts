import { cert, getApps, initializeApp, App } from 'firebase-admin/app'
import { getFirestore, Firestore } from 'firebase-admin/firestore'
import { getAuth, Auth } from 'firebase-admin/auth'
import { getStorage, Storage } from 'firebase-admin/storage'

let _app: App | null = null
let _db: Firestore | null = null
let _auth: Auth | null = null
let _storage: Storage | null = null

function parsePrivateKey(raw: string | undefined): string {
  if (!raw) throw new Error('FIREBASE_PRIVATE_KEY is not set')
  // If stored as a JSON string with surrounding quotes (common Vercel pattern), parse it
  if (raw.startsWith('"') && raw.endsWith('"')) {
    return JSON.parse(raw) as string
  }
  // Otherwise replace escaped newlines with real newlines
  return raw.replace(/\\n/g, '\n')
}

function initApp(): App {
  if (getApps().length > 0) return getApps()[0]

  const projectId = process.env.FIREBASE_PROJECT_ID
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL
  const privateKey = parsePrivateKey(process.env.FIREBASE_PRIVATE_KEY)

  if (!projectId || !clientEmail) {
    throw new Error('Missing Firebase Admin credentials in environment variables')
  }

  return initializeApp({
    credential: cert({ projectId, clientEmail, privateKey }),
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
