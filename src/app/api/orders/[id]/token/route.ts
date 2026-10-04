import { NextRequest, NextResponse } from 'next/server'
import { fsGet, fsUpdate } from '@/lib/firestoreRest'
import { getGoogleAccessToken } from '@/lib/googleAuth'
import { normalizePhone } from '@/lib/utils'

export const runtime = 'edge'

// Firestore auto-generated ids are alphanumeric. Rejecting anything else
// stops crafted ids from reaching into other documents through the URL.
const ORDER_ID_PATTERN = /^[A-Za-z0-9]{10,64}$/

// Lets a customer attach a push token to an order they placed. Ownership is
// proven by the phone number on the order, which only the customer knows.
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { notificationToken, customerPhone } = await req.json()

    if (typeof notificationToken !== 'string' || !notificationToken || notificationToken.length > 500) {
      return NextResponse.json({ error: 'A valid notificationToken is required' }, { status: 400 })
    }
    if (typeof customerPhone !== 'string') {
      return NextResponse.json({ error: 'customerPhone is required' }, { status: 400 })
    }
    if (!ORDER_ID_PATTERN.test(params.id)) {
      return NextResponse.json({ error: 'Invalid order id' }, { status: 400 })
    }

    const token = await getGoogleAccessToken()
    const orderPath = `orders/${params.id}`
    const orderDoc = await fsGet(orderPath, token)
    if (!orderDoc.exists) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    const digits = normalizePhone(customerPhone)
    const orderDigits = String(orderDoc.data().customerPhoneDigits ?? '')
    if (digits.length < 7 || digits !== orderDigits) {
      return NextResponse.json({ error: 'That phone number does not match this order' }, { status: 403 })
    }

    await fsUpdate(orderPath, { notificationToken }, token)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[PATCH /api/orders/:id/token]', error)
    return NextResponse.json({ error: 'Failed to save notification token' }, { status: 500 })
  }
}
