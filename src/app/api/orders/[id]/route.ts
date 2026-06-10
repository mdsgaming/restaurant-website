import { NextRequest, NextResponse } from 'next/server'
import { fsUpdate } from '@/lib/firestoreRest'
import { getGoogleAccessToken } from '@/lib/googleAuth'

export const runtime = 'edge'

const VALID_STATUSES = ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { status } = await req.json()

    if (!VALID_STATUSES.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    const token = await getGoogleAccessToken()
    await fsUpdate(`orders/${params.id}`, { status, updatedAt: new Date() }, token)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[PATCH /api/orders/:id]', error)
    return NextResponse.json({ error: 'Failed to update order' }, { status: 500 })
  }
}
