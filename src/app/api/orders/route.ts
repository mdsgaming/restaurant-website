import { NextRequest, NextResponse } from 'next/server'
import { fsAdd, fsQuery, fsGet, fsList } from '@/lib/firestoreRest'
import { getGoogleAccessToken } from '@/lib/googleAuth'
import { sendFcmMessageToMany } from '@/lib/fcm'
import { normalizePhone, formatPrice } from '@/lib/utils'
import { verifyStaffAuth } from '@/lib/verifyStaffAuth'

export const runtime = 'edge'

const MAX_NAME_LEN = 100
const MAX_NOTES_LEN = 500
const MAX_ITEMS = 50

export async function POST(req: NextRequest) {
  try {
    const { customerName, customerPhone, orderType, items, notes, notificationToken } = await req.json()

    if (!customerName?.trim() || !customerPhone?.trim() || !orderType || !Array.isArray(items) || !items.length) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (customerName.trim().length > MAX_NAME_LEN) {
      return NextResponse.json({ error: 'Name is too long' }, { status: 400 })
    }

    // Online orders are pickup only. Dine-in is no longer offered online.
    if (orderType !== 'TAKEOUT') {
      return NextResponse.json({ error: 'Online orders are for pickup only' }, { status: 400 })
    }

    if (items.length > MAX_ITEMS) {
      return NextResponse.json({ error: 'Too many items in order' }, { status: 400 })
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

    // SECURITY: never trust client-supplied prices/names. Re-derive every
    // line item (and the total) from the real menu data in Firestore, so a
    // tampered request can't order food at an arbitrary price.
    const uniqueItemIds = Array.from(
      new Set(items.map((i: { itemId?: string }) => i?.itemId).filter((id: unknown): id is string => typeof id === 'string'))
    )
    if (uniqueItemIds.length === 0) {
      return NextResponse.json({ error: 'Invalid items in order' }, { status: 400 })
    }

    const menuDocs = await Promise.all(uniqueItemIds.map((id) => fsGet(`menuItems/${id}`, token)))
    const menuById = new Map(
      menuDocs
        .filter((d) => d.exists)
        .map((d) => [d.id, d.data() as { name?: string; price?: number; isAvailable?: boolean }])
    )

    const orderItems: Array<{ itemId: string; name: string; price: number; quantity: number }> = []
    for (const raw of items as Array<{ itemId?: string; quantity?: number }>) {
      const itemId = raw?.itemId
      const quantity = Number(raw?.quantity)
      if (typeof itemId !== 'string' || !Number.isInteger(quantity) || quantity < 1 || quantity > 50) {
        return NextResponse.json({ error: 'Invalid item quantity' }, { status: 400 })
      }
      const menuItem = menuById.get(itemId)
      if (!menuItem || menuItem.isAvailable === false || typeof menuItem.price !== 'number') {
        return NextResponse.json({ error: 'One or more items are no longer available' }, { status: 400 })
      }
      orderItems.push({
        itemId,
        name: menuItem.name || 'Item',
        price: menuItem.price,
        quantity,
      })
    }

    const total = orderItems.reduce((sum, i) => sum + i.price * i.quantity, 0)

    const ref = await fsAdd('orders', {
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      customerPhoneDigits: normalizePhone(customerPhone),
      orderType,
      items: orderItems,
      notes: (notes?.trim() || '').slice(0, MAX_NOTES_LEN),
      total,
      notificationToken: typeof notificationToken === 'string' ? notificationToken.slice(0, 500) : '',
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
          body: `${customerName.trim()} — ${formatPrice(total)} (${orderType === 'DINE_IN' ? 'Dine-in' : 'Takeout'})`,
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

export async function GET(req: NextRequest) {
  const staff = await verifyStaffAuth(req)
  if (!staff) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

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
