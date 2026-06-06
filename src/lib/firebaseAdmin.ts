import { cert, getApps, initializeApp, App, ServiceAccount } from 'firebase-admin/app'
import { getAuth, Auth } from 'firebase-admin/auth'

let _app: App | null = null
let _auth: Auth | null = null

function initApp(): App {
  if (getApps().length > 0) return getApps()[0]
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT
  if (!raw) throw new Error('FIREBASE_SERVICE_ACCOUNT env var is not set')
  const serviceAccount = JSON.parse(raw) as ServiceAccount
  return initializeApp({ credential: cert(serviceAccount) })
}

export function getAdminApp(): App {
  if (!_app) _app = initApp()
  return _app
}

export function getAdminAuth(): Auth {
  if (!_auth) _auth = getAuth(getAdminApp())
  return _auth
}
