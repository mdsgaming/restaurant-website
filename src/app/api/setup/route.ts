import { NextRequest, NextResponse } from 'next/server'
import { createUser, getUserByEmail, setCustomUserClaims } from '@/lib/firebaseAuthRest'
import { fsGet, fsSet, fsAdd } from '@/lib/firestoreRest'
import { getGoogleAccessToken } from '@/lib/googleAuth'
import { DEFAULT_SETTINGS } from '@/lib/utils'

export const runtime = 'edge'

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization')
    const setupKey = process.env.SETUP_SECRET_KEY

    if (setupKey && authHeader !== `Bearer ${setupKey}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = await getGoogleAccessToken()

    const settingsDoc = await fsGet('settings/restaurant', token)
    if (settingsDoc.exists) {
      return NextResponse.json({ error: 'Setup already completed' }, { status: 400 })
    }

    const devEmail = process.env.DEVELOPER_EMAIL
    const devPassword = process.env.DEVELOPER_PASSWORD
    const devName = process.env.DEVELOPER_NAME || 'Developer'

    if (!devEmail || !devPassword) {
      return NextResponse.json(
        { error: 'DEVELOPER_EMAIL and DEVELOPER_PASSWORD env vars required' },
        { status: 400 }
      )
    }

    let devUid: string
    try {
      const existing = await getUserByEmail(devEmail, token)
      devUid = existing.uid
    } catch {
      const userRecord = await createUser({
        email: devEmail,
        password: devPassword,
        displayName: devName,
      }, token)
      devUid = userRecord.uid
    }

    await setCustomUserClaims(devUid, { role: 'DEVELOPER' }, token)

    await fsSet(`users/${devUid}`, {
      email: devEmail,
      name: devName,
      role: 'DEVELOPER',
      isActive: true,
      createdAt: new Date(),
    }, token)

    await fsSet('settings/restaurant', DEFAULT_SETTINGS as unknown as Record<string, unknown>, token)

    const platforms = [
      { platform: 'UBER_EATS', displayName: 'Uber Eats', url: '', isActive: false },
      { platform: 'DOORDASH', displayName: 'DoorDash', url: '', isActive: false },
      { platform: 'GRUBHUB', displayName: 'Grubhub', url: '', isActive: false },
    ]
    for (const p of platforms) {
      await fsSet(`deliveryPlatforms/${p.platform}`, p, token)
    }

    const categories = [
      { name: 'Small Chops & Starters', description: 'Light bites and crowd-pleasers to kick things off', sortOrder: 0, isActive: true, createdAt: new Date() },
      { name: 'Grills & Suya', description: 'Smoky, flame-grilled Nigerian street food classics', sortOrder: 1, isActive: true, createdAt: new Date() },
      { name: 'Rice Dishes', description: 'Our signature rice plates — the heart of the menu', sortOrder: 2, isActive: true, createdAt: new Date() },
      { name: 'Soups & Swallows', description: 'Rich West African soups served with your choice of swallow', sortOrder: 3, isActive: true, createdAt: new Date() },
      { name: 'Drinks', description: 'Refreshing African and international beverages', sortOrder: 4, isActive: true, createdAt: new Date() },
    ]
    const categoryIds: string[] = []
    for (const cat of categories) {
      const ref = await fsAdd('menuCategories', cat, token)
      categoryIds.push(ref.id)
    }

    const menuItems = [
      // Small Chops & Starters
      { categoryId: categoryIds[0], name: 'Pepper Soup', description: 'Spiced goat meat broth with uziza leaves and African pepper — warming and aromatic', price: 14, isAvailable: true, isSpicy: true, isVegetarian: false, isGlutenFree: true, isFeatured: true, sortOrder: 0, imageUrl: '' },
      { categoryId: categoryIds[0], name: 'Small Chops Platter', description: 'Puff puff, samosa, spring rolls, chicken skewers — perfect for sharing', price: 18, isAvailable: true, isSpicy: false, isVegetarian: false, isGlutenFree: false, isFeatured: true, sortOrder: 1, imageUrl: '' },
      { categoryId: categoryIds[0], name: 'Moi Moi', description: 'Steamed bean pudding with egg and fish, served with a side of ogi', price: 10, isAvailable: true, isSpicy: false, isVegetarian: false, isGlutenFree: true, isFeatured: false, sortOrder: 2, imageUrl: '' },

      // Grills & Suya
      { categoryId: categoryIds[1], name: 'Beef Suya', description: 'Spiced, skewered and chargrilled beef — served with sliced onions, tomatoes and yaji', price: 19, isAvailable: true, isSpicy: true, isVegetarian: false, isGlutenFree: true, isFeatured: true, sortOrder: 0, imageUrl: '' },
      { categoryId: categoryIds[1], name: 'Grilled Tilapia', description: 'Whole tilapia marinated in African spices, grilled over open flame', price: 24, isAvailable: true, isSpicy: true, isVegetarian: false, isGlutenFree: true, isFeatured: true, sortOrder: 1, imageUrl: '' },
      { categoryId: categoryIds[1], name: 'Peppered Gizzard', description: 'Tender gizzard sautéed in a bold, spicy pepper sauce', price: 16, isAvailable: true, isSpicy: true, isVegetarian: false, isGlutenFree: true, isFeatured: false, sortOrder: 2, imageUrl: '' },

      // Rice Dishes
      { categoryId: categoryIds[2], name: 'Party Jollof Rice', description: 'Smoky, perfectly seasoned tomato rice with fried chicken and coleslaw — the classic party plate', price: 18, isAvailable: true, isSpicy: false, isVegetarian: false, isGlutenFree: true, isFeatured: true, sortOrder: 0, imageUrl: '' },
      { categoryId: categoryIds[2], name: 'Nigerian Fried Rice', description: 'Stir-fried long grain rice with liver, shrimp, mixed vegetables and spices', price: 18, isAvailable: true, isSpicy: false, isVegetarian: false, isGlutenFree: true, isFeatured: false, sortOrder: 1, imageUrl: '' },
      { categoryId: categoryIds[2], name: 'Ofada Rice & Stew', description: 'Local unpolished rice served with spicy locust bean ofada stew', price: 20, isAvailable: true, isSpicy: true, isVegetarian: false, isGlutenFree: true, isFeatured: true, sortOrder: 2, imageUrl: '' },

      // Soups & Swallows
      { categoryId: categoryIds[3], name: 'Egusi Soup', description: 'Ground melon seed soup with assorted meat, stockfish and leafy greens — served with fufu or eba', price: 20, isAvailable: true, isSpicy: false, isVegetarian: false, isGlutenFree: true, isFeatured: true, sortOrder: 0, imageUrl: '' },
      { categoryId: categoryIds[3], name: 'Ofe Onugbu (Bitter Leaf Soup)', description: 'Slow-cooked bitter leaf and cocoyam soup with oxtail and smoked fish', price: 22, isAvailable: true, isSpicy: false, isVegetarian: false, isGlutenFree: true, isFeatured: false, sortOrder: 1, imageUrl: '' },
      { categoryId: categoryIds[3], name: 'Ogbono Soup', description: 'Drew ogbono seed soup with spinach and assorted meat — served with pounded yam', price: 20, isAvailable: true, isSpicy: false, isVegetarian: false, isGlutenFree: true, isFeatured: false, sortOrder: 2, imageUrl: '' },

      // Drinks
      { categoryId: categoryIds[4], name: 'Zobo Drink', description: 'Chilled hibiscus flower drink with ginger and pineapple — house-made and lightly sweetened', price: 5, isAvailable: true, isSpicy: false, isVegetarian: true, isGlutenFree: true, isFeatured: true, sortOrder: 0, imageUrl: '' },
      { categoryId: categoryIds[4], name: 'Chapman', description: 'Classic Nigerian cocktail with Fanta, Sprite, Angostura bitters and cucumber', price: 7, isAvailable: true, isSpicy: false, isVegetarian: true, isGlutenFree: true, isFeatured: false, sortOrder: 1, imageUrl: '' },
      { categoryId: categoryIds[4], name: 'Kunu Aya (Tigernut Milk)', description: 'Creamy, naturally sweet tigernut drink — dairy-free and nourishing', price: 6, isAvailable: true, isSpicy: false, isVegetarian: true, isGlutenFree: true, isFeatured: false, sortOrder: 2, imageUrl: '' },
    ]
    for (const item of menuItems) {
      await fsAdd('menuItems', { ...item, createdAt: new Date() }, token)
    }

    return NextResponse.json({
      success: true,
      message: 'Setup complete. Developer account created.',
      credentials: { email: devEmail },
    })
  } catch (error) {
    console.error('Setup error:', error)
    return NextResponse.json(
      { error: (error as Error).message || 'Setup failed' },
      { status: 500 }
    )
  }
}
