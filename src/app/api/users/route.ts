import { NextRequest, NextResponse } from 'next/server'
import { getAdminAuth, getAdminDb } from '@/lib/firebaseAdmin'

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

    const adminAuth = getAdminAuth()
    const adminDb = getAdminDb()

    const userRecord = await adminAuth.createUser({
      email,
      password,
      displayName: name,
    })

    await adminAuth.setCustomUserClaims(userRecord.uid, { role })

    await adminDb.collection('users').doc(userRecord.uid).set({
      email,
      name,
      role,
      isActive: true,
      createdAt: new Date(),
    })

    return NextResponse.json({ uid: userRecord.uid }, { status: 201 })
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
    const snap = await getAdminDb().collection('users').get()
    const users = snap.docs.map((d) => ({ uid: d.id, ...d.data() }))
    return NextResponse.json(users)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
  }
}
