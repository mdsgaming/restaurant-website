import { NextRequest, NextResponse } from 'next/server'
import { fsAdd, fsQuery } from '@/lib/firestoreRest'
import { getGoogleAccessToken } from '@/lib/googleAuth'

export const runtime = 'edge'

export async function POST(req: NextRequest) {
  try {
    const { customerName, customerPhone, orderType, items, notes, total } = await req.json()

    if (!customerName?.trim() || !customerPhone?.trim() || !orderType || !items?.length) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (!['DINE_IN', 'TAKEOUT'].includes(orderType)) {
      return NextResponse.json({ error: 'Invalid order type' }, { status: 400 })
    }

    const token = await getGoogleAccessToken()
    const ref = await fsAdd('orders', {
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      orderType,
      items,
      notes: notes?.trim() || '',
      total: Number(total) || 0,
      status: 'PENDING',
      createdAt: new Date(),
      updatedAt: new Date(),
    }, token)

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
