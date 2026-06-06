import { NextRequest, NextResponse } from 'next/server'
import { getAdminAuth, getAdminDb } from '@/lib/firebaseAdmin'

export const runtime = 'edge'

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { role, isActive, name } = await req.json()
    const uid = params.id
    const adminAuth = getAdminAuth()
    const adminDb = getAdminDb()

    const updates: Record<string, unknown> = {}
    const authUpdates: Record<string, unknown> = {}
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
      await adminAuth.updateUser(uid, authUpdates)
    }

    if (Object.keys(claimUpdates).length > 0) {
      const user = await adminAuth.getUser(uid)
      await adminAuth.setCustomUserClaims(uid, {
        ...user.customClaims,
        ...claimUpdates,
      })
    }

    await adminDb.collection('users').doc(uid).update({
      ...updates,
      updatedAt: new Date(),
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 })
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const uid = params.id
    await getAdminAuth().deleteUser(uid)
    await getAdminDb().collection('users').doc(uid).delete()
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 })
  }
}
