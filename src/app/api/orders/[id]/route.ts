import { NextRequest, NextResponse } from 'next/server'
import { fsUpdate, fsGet } from '@/lib/firestoreRest'
import { getGoogleAccessToken } from '@/lib/googleAuth'
import { sendFcmMessage } from '@/lib/fcm'

export const runtime = 'edge'

const VALID_STATUSES = ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']

const STATUS_NOTIFICATIONS: Record<string, { title: string; body: string } | null> = {
  PENDING: null,
  IN_PROGRESS: { title: 'Order Update', body: "We've started preparing your food!" },
  COMPLETED: { title: 'Order Ready!', body: 'Your order is ready for pickup.' },
  CANCELLED: { title: 'Order Cancelled', body: 'Your order has been cancelled. Please call us with any questions.' },
}

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

    // Notify the customer's device if they opted into push updates.
    // Never let a notification failure affect the status update response.
    try {
      const notification = STATUS_NOTIFICATIONS[status]
      if (notification) {
        const orderDoc = await fsGet(`orders/${params.id}`, token)
        const notificationToken = orderDoc.exists ? (orderDoc.data().notificationToken as string) : ''
        if (notificationToken) {
          await sendFcmMessage(token, {
            token: notificationToken,
            title: notification.title,
            body: notification.body,
            url: '/track-order',
          })
        }
      }
    } catch (notifyErr) {
      console.error('[PATCH /api/orders/:id] customer notify failed:', notifyErr)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[PATCH /api/orders/:id]', error)
    return NextResponse.json({ error: 'Failed to update order' }, { status: 500 })
  }
}
