'use client'

import { auth } from './firebase'

/**
 * Returns an Authorization header carrying the signed-in staff member's
 * Firebase ID token, or an empty object when no one is signed in. The server
 * decides whether the request is allowed.
 */
export async function staffAuthHeaders(): Promise<Record<string, string>> {
  const token = await auth?.currentUser?.getIdToken()
  return token ? { Authorization: `Bearer ${token}` } : {}
}
