import { NextRequest, NextResponse } from 'next/server'
import { getUser, updateUser, setCustomUserClaims, deleteUser } from '@/lib/firebaseAuthRest'
import { fsUpdate, fsDelete } from '@/lib/firestoreRest'
import { getGoogleAccessToken } from '@/lib/googleAuth'

export const runtime = 'edge'

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { role, isActive, name } = await req.json()
    const uid = params.id
    const token = await getGoogleAccessToken()

    const updates: Record<string, unknown> = {}
    const authUpdates: { displayName?: string; disabled?: boolean } = {}
    const claimUpdates: Record<string, unknown> = {}

    if (role) {
      if (!['DEVELOPER', 'ADMIN', 'ASSISTANT'].includes(role)) {
        return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
      }
      updates.role = role
      claimUpdates.role = role
    }

    if (typeof isActive === 'boolean') {
      updates.isActive = isActive
      authUpdates.disabled = !isActive
    }

    if (name) {
      updates.name = name
      authUpdates.displayName = name
    }

    if (Object.keys(authUpdates).length > 0) {
      await updateUser(uid, authUpdates, token)
    }

    if (Object.keys(claimUpdates).length > 0) {
      const user = await getUser(uid, token)
      await setCustomUserClaims(uid, {
        ...(user.customClaims ?? {}),
        ...claimUpdates,
      }, token)
    }

    await fsUpdate(`users/${uid}`, { ...updates, updatedAt: new Date() }, token)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[PATCH /api/users/:id]', error)
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 })
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const uid = params.id
    const token = await getGoogleAccessToken()
    await deleteUser(uid, token)
    await fsDelete(`users/${uid}`, token)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[DELETE /api/users/:id]', error)
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 })
  }
}
