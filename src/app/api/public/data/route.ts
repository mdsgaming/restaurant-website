import { NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebaseAdmin'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const db = getAdminDb()
    const [settingsSnap, categoriesSnap, itemsSnap, gallerySnap, platformsSnap] = await Promise.all([
      db.collection('settings').doc('restaurant').get(),
      db.collection('menuCategories').orderBy('sortOrder').get(),
      db.collection('menuItems').orderBy('sortOrder').get(),
      db.collection('gallery').where('isActive', '==', true).orderBy('sortOrder').get(),
      db.collection('deliveryPlatforms').get(),
    ])

    return NextResponse.json({
      settings: settingsSnap.exists ? settingsSnap.data() : null,
      categories: categoriesSnap.docs.map((d) => ({ id: d.id, ...d.data() })),
      items: itemsSnap.docs.map((d) => ({ id: d.id, ...d.data() })),
      gallery: gallerySnap.docs.map((d) => ({ id: d.id, ...d.data() })),
      platforms: platformsSnap.docs.map((d) => ({ id: d.id, ...d.data() })),
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
