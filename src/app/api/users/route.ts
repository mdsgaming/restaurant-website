import { NextRequest, NextResponse } from 'next/server'
import { createUser, setCustomUserClaims } from '@/lib/firebaseAuthRest'
import { fsSet, fsList } from '@/lib/firestoreRest'
import { getGoogleAccessToken } from '@/lib/googleAuth'

export const runtime = 'edge'

export async function POST(req: NextRequest) {
  try {
    const { name, email, password, role } = await req.json()

    if (!name || !email || !password || !role) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (!['DEVELOPER', 'ADMIN', 'ASSISTANT'].includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
    }

    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })
    }

    const token = await getGoogleAccessToken()

    const { uid } = await createUser({ email, password, displayName: name }, token)
    await setCustomUserClaims(uid, { role }, token)
    await fsSet(`users/${uid}`, {
      email,
      name,
      role,
      isActive: true,
      createdAt: new Date(),
    }, token)

    return NextResponse.json({ uid }, { status: 201 })
  } catch (error: unknown) {
    console.error('[POST /api/users]', error)
    const err = error as { code?: string; message?: string }
    const code = err.code ?? ''
    const msg =
      code === 'auth/email-already-exists' ? 'A user with this email already exists' :
      code === 'auth/invalid-email' ? 'Invalid email address' :
      code === 'auth/weak-password' ? 'Password must be at least 6 characters' :
      code === 'auth/invalid-password' ? 'Password must be at least 6 characters' :
      err.message || 'Failed to create user'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function GET() {
  try {
    const token = await getGoogleAccessToken()
    const docs = await fsList('users', token)
    const users = docs.map(({ id, ...rest }) => ({ uid: id, ...rest }))
    return NextResponse.json(users)
  } catch (error) {
    console.error('[GET /api/users]', error)
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
  }
}
