import { NextRequest, NextResponse } from 'next/server'
import { fsGet, fsUpdate } from '@/lib/firestoreRest'
import { getGoogleAccessToken } from '@/lib/googleAuth'
import { verifyStaffAuth } from '@/lib/verifyStaffAuth'
import { CATERING_STATUSES, isOption } from '@/lib/catering'

export const runtime = 'edge'

const ADMIN_ROLES = ['ADMIN', 'DEVELOPER']
const ID_PATTERN = /^[A-Za-z0-9]{10,64}$/

// Admins only: update a catering request's status and/or private notes.
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const staff = await verifyStaffAuth(req)
  if (!staff) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!ADMIN_ROLES.includes(staff.role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  if (!ID_PATTERN.test(params.id)) return NextResponse.json({ error: 'Invalid request id' }, { status: 400 })

  try {
    const body = await req.json()
    const updates: Record<string, unknown> = {}

    if (body.status !== undefined) {
      if (!isOption(CATERING_STATUSES, body.status)) {
        return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
      }
      updates.status = body.status
    }
    if (body.adminNotes !== undefined) {
      if (typeof body.adminNotes !== 'string') {
        return NextResponse.json({ error: 'Invalid notes' }, { status: 400 })
      }
      updates.adminNotes = body.adminNotes.slice(0, 2000)
    }
    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })
    }

    const token = await getGoogleAccessToken()
    const path = `cateringRequests/${params.id}`
    const existing = await fsGet(path, token)
    if (!existing.exists) return NextResponse.json({ error: 'Request not found' }, { status: 404 })

    await fsUpdate(path, { ...updates, updatedAt: new Date() }, token)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[PATCH /api/catering/:id]', error)
    return NextResponse.json({ error: 'Failed to update request' }, { status: 500 })
  }
}
