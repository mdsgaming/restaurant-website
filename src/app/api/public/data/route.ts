import { NextResponse } from 'next/server'
import { fsGet, fsQuery, fsList } from '@/lib/firestoreRest'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const [settingsDoc, categories, items, gallery, platforms] = await Promise.all([
      fsGet('settings/restaurant'),
      fsQuery('menuCategories', { orderBy: [['sortOrder', 'ASCENDING']] }),
      fsQuery('menuItems', { orderBy: [['sortOrder', 'ASCENDING']] }),
      fsQuery('gallery', {
        where: [['isActive', 'EQUAL', true]],
        orderBy: [['sortOrder', 'ASCENDING']],
      }),
      fsList('deliveryPlatforms'),
    ])

    return NextResponse.json({
      settings: settingsDoc.exists ? settingsDoc.data() : null,
      categories,
      items,
      gallery,
      platforms,
    })
  } catch (err) {
    console.error('[/api/public/data]', err)
    return NextResponse.json({
      settings: null,
      categories: [],
      items: [],
      gallery: [],
      platforms: [],
    })
  }
}
