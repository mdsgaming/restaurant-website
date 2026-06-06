// Firebase Auth Admin REST API — Edge Runtime compatible (no Node.js deps)
// Uses the same Identity Toolkit v1 endpoints as firebase-admin, but via fetch.

const BASE = 'https://identitytoolkit.googleapis.com/v1'

async function authPost(
  endpoint: string,
  body: Record<string, unknown>,
  token: string,
): Promise<Record<string, unknown>> {
  const res = await fetch(`${BASE}/${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  })
  const data = await res.json() as Record<string, unknown>
  if (!res.ok) {
    const errMsg = ((data.error as Record<string, unknown>)?.message ?? 'Auth error') as string
    const code =
      errMsg === 'EMAIL_EXISTS' ? 'auth/email-already-exists' :
      errMsg === 'USER_NOT_FOUND' ? 'auth/user-not-found' :
      errMsg === 'INVALID_EMAIL' ? 'auth/invalid-email' :
      errMsg.startsWith('WEAK_PASSWORD') ? 'auth/weak-password' :
      errMsg.startsWith('INVALID_PASSWORD') ? 'auth/invalid-password' :
      'auth/unknown'
    throw Object.assign(new Error(errMsg), { code })
  }
  return data
}

function parseUser(u: Record<string, unknown>): AuthUser {
  let customClaims: Record<string, unknown> | undefined
  if (typeof u.customAttributes === 'string') {
    try { customClaims = JSON.parse(u.customAttributes) } catch {}
  }
  return {
    uid: u.localId as string,
    email: u.email as string,
    displayName: u.displayName as string | undefined,
    disabled: Boolean(u.disabled),
    customClaims,
  }
}

export interface AuthUser {
  uid: string
  email: string
  displayName?: string
  disabled: boolean
  customClaims?: Record<string, unknown>
}

export async function createUser(
  data: { email: string; password: string; displayName?: string },
  token: string,
): Promise<{ uid: string }> {
  const res = await authPost('accounts:signUp', {
    email: data.email,
    password: data.password,
    ...(data.displayName ? { displayName: data.displayName } : {}),
  }, token)
  return { uid: res.localId as string }
}

export async function getUserByEmail(email: string, token: string): Promise<AuthUser> {
  const res = await authPost('accounts:lookup', { email: [email] }, token)
  const users = (res.users ?? []) as Array<Record<string, unknown>>
  if (!users.length) {
    throw Object.assign(
      new Error('No user found with the provided email'),
      { code: 'auth/user-not-found' },
    )
  }
  return parseUser(users[0])
}

export async function getUser(uid: string, token: string): Promise<AuthUser> {
  const res = await authPost('accounts:lookup', { localId: [uid] }, token)
  const users = (res.users ?? []) as Array<Record<string, unknown>>
  if (!users.length) {
    throw Object.assign(
      new Error('No user found with the provided uid'),
      { code: 'auth/user-not-found' },
    )
  }
  return parseUser(users[0])
}

export async function updateUser(
  uid: string,
  data: { displayName?: string; disabled?: boolean },
  token: string,
): Promise<void> {
  const body: Record<string, unknown> = { localId: uid }
  if (data.displayName !== undefined) body.displayName = data.displayName
  if (data.disabled !== undefined) body.disableUser = data.disabled
  await authPost('accounts:update', body, token)
}

export async function setCustomUserClaims(
  uid: string,
  claims: Record<string, unknown>,
  token: string,
): Promise<void> {
  await authPost('accounts:update', {
    localId: uid,
    customAttributes: JSON.stringify(claims),
  }, token)
}

export async function deleteUser(uid: string, token: string): Promise<void> {
  await authPost('accounts:delete', { localId: uid }, token)
}
