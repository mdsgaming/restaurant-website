import { NextRequest, NextResponse } from 'next/server'
import { fsAdd, fsQuery, fsGet, fsList } from '@/lib/firestoreRest'
import { getGoogleAccessToken } from '@/lib/googleAuth'
import { sendFcmMessageToMany } from '@/lib/fcm'
import { normalizePhone, formatPrice } from '@/lib/utils'

export const runtime = 'edge'

export async function POST(req: NextRequest) {
  try {
    const { customerName, customerPhone, orderType, items, notes, total, notificationToken } = await req.json()

    if (!customerName?.trim() || !customerPhone?.trim() || !orderType || !items?.length) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (!['DINE_IN', 'TAKEOUT'].includes(orderType)) {
      return NextResponse.json({ error: 'Invalid order type' }, { status: 400 })
    }

    const token = await getGoogleAccessToken()

    // Server-side enforcement of the admin "ordering enabled" toggle —
    // defense in depth in case a client bypasses the UI gate.
    const settingsDoc = await fsGet('settings/restaurant', token)
    if (settingsDoc.exists && settingsDoc.data().orderingEnabled === false) {
      return NextResponse.json(
        { error: 'Online ordering is currently unavailable. Please call to place your order.' },
        { status: 403 }
      )
    }

    const ref = await fsAdd('orders', {
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      customerPhoneDigits: normalizePhone(customerPhone),
      orderType,
      items,
      notes: notes?.trim() || '',
      total: Number(total) || 0,
      notificationToken: typeof notificationToken === 'string' ? notificationToken : '',
      status: 'PENDING',
      createdAt: new Date(),
      updatedAt: new Date(),
    }, token)

    // Notify admin/staff devices that have opted into push notifications.
    // Never let a notification failure affect the order response.
    try {
      const adminTokenDocs = await fsList('adminFcmTokens', token)
      const adminTokens = adminTokenDocs
        .map((d) => d.token as string)
        .filter((t): t is string => typeof t === 'string' && t.length > 0)
      if (adminTokens.length > 0) {
        await sendFcmMessageToMany(token, adminTokens, {
          title: 'New Order Received',
          body: `${customerName.trim()} — ${formatPrice(Number(total) || 0)} (${orderType === 'DINE_IN' ? 'Dine-in' : 'Takeout'})`,
          url: '/admin/orders',
          data: { orderId: ref.id },
        })
      }
    } catch (notifyErr) {
      console.error('[POST /api/orders] admin notify failed:', notifyErr)
    }

    return NextResponse.json({ id: ref.id }, { status: 201 })
  } catch (error) {
    console.error('[POST /api/orders]', error)
    return NextResponse.json({ error: 'Failed to submit order' }, { status: 500 })
  }
}

export async function GET() {
  try {
    const token = await getGoogleAccessToken()
    const orders = await fsQuery('orders', {
      orderBy: [['createdAt', 'DESCENDING']],
    }, token)
    return NextResponse.json(orders)
  } catch (error) {
    console.error('[GET /api/orders]', error)
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 })
  }
}
