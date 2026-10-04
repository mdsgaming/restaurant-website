import { NextRequest, NextResponse } from 'next/server'
import { fsQuery } from '@/lib/firestoreRest'
import { getGoogleAccessToken } from '@/lib/googleAuth'
import { normalizePhone } from '@/lib/utils'

export const runtime = 'edge'

// Public endpoint: customers look up their own orders by phone number
// without needing an account or SMS round-trip. Only returns orders from
// the last 48 hours to avoid surfacing someone's entire order history.
export async function GET(req: NextRequest) {
  try {
    const phone = req.nextUrl.searchParams.get('phone') || ''
    const digits = normalizePhone(phone)

    if (digits.length < 7) {
      return NextResponse.json({ error: 'Enter a valid phone number' }, { status: 400 })
    }

    const token = await getGoogleAccessToken()
    const orders = await fsQuery('orders', {
      where: [['customerPhoneDigits', 'EQUAL', digits]],
    }, token)

    const cutoff = Date.now() - 48 * 60 * 60 * 1000
    const recent = orders
      .filter((o) => {
        const createdAt = o.createdAt as string | undefined
        if (!createdAt) return true
        return new Date(createdAt).getTime() >= cutoff
      })
      .sort((a, b) => {
        const aTime = new Date((a.createdAt as string) || 0).getTime()
        const bTime = new Date((b.createdAt as string) || 0).getTime()
        return bTime - aTime
      })

    return NextResponse.json(recent)
  } catch (error) {
    console.error('[GET /api/orders/track]', error)
    return NextResponse.json({ error: 'Failed to look up orders' }, { status: 500 })
  }
}
