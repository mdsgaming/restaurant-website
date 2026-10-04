// Verifies a Firebase ID token sent by the admin panel and confirms the
// signed-in user is an active staff member, before allowing access to
// order data or mutations. Edge Runtime compatible (fetch only).
import { fsGet } from './firestoreRest'
import { getGoogleAccessToken } from './googleAuth'

export interface StaffUser {
  uid: string
  role: string
}

const STAFF_ROLES = ['DEVELOPER', 'ADMIN', 'ASSISTANT']

/**
 * Reads the `Authorization: Bearer <idToken>` header, verifies it against
 * Identity Toolkit, and confirms the user has an active staff account in
 * Firestore. Returns null (never throws) on any failure — callers should
 * respond 401/403 themselves so error wording stays consistent per route.
 */
export async function verifyStaffAuth(req: Request): Promise<StaffUser | null> {
  try {
    const authHeader = req.headers.get('Authorization') || ''
    const idToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : ''
    if (!idToken) return null

    const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY
    if (!apiKey) return null

    const lookupRes = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      }
    )
    if (!lookupRes.ok) return null
    const lookupData = await lookupRes.json() as { users?: Array<{ localId: string }> }
    const uid = lookupData.users?.[0]?.localId
    if (!uid) return null

    const serviceToken = await getGoogleAccessToken()
    const userDoc = await fsGet(`users/${uid}`, serviceToken)
    if (!userDoc.exists) return null

    const userData = userDoc.data() as { role?: string; isActive?: boolean }
    if (userData.isActive !== true) return null
    if (!userData.role || !STAFF_ROLES.includes(userData.role)) return null

    return { uid, role: userData.role }
  } catch {
    return null
  }
}
