import { NextRequest, NextResponse } from 'next/server'
import { fsUpdate } from '@/lib/firestoreRest'
import { getGoogleAccessToken } from '@/lib/googleAuth'

export const runtime = 'edge'

// Public endpoint: lets a customer attach (or refresh) a push-notification
// token to an order they already placed, e.g. if they skipped the prompt
// at checkout and opt in later from the order-tracking page.
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { notificationToken } = await req.json()
    if (typeof notificationToken !== 'string' || !notificationToken) {
      return NextResponse.json({ error: 'notificationToken is required' }, { status: 400 })
    }

    const token = await getGoogleAccessToken()
    await fsUpdate(`orders/${params.id}`, { notificationToken }, token)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[PATCH /api/orders/:id/token]', error)
    return NextResponse.json({ error: 'Failed to save notification token' }, { status: 500 })
  }
}
