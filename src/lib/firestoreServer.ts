import { getAdminDb } from './firebaseAdmin'
import type {
  RestaurantSettings,
  MenuCategory,
  MenuItem,
  GalleryItem,
  DeliveryPlatform,
} from '@/types'

export async function getRestaurantSettingsServer(): Promise<RestaurantSettings | null> {
  const snap = await getAdminDb().collection('settings').doc('restaurant').get()
  return snap.exists ? (snap.data() as RestaurantSettings) : null
}

export async function getMenuCategoriesServer(): Promise<MenuCategory[]> {
  const snap = await getAdminDb()
    .collection('menuCategories')
    .orderBy('sortOrder')
    .get()
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as MenuCategory))
}

export async function getMenuItemsServer(categoryId?: string): Promise<MenuItem[]> {
  const col = getAdminDb().collection('menuItems')
  const q = categoryId
    ? col.where('categoryId', '==', categoryId).orderBy('sortOrder')
    : col.orderBy('sortOrder')
  const snap = await q.get()
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as MenuItem))
}

export async function getGalleryItemsServer(activeOnly = false): Promise<GalleryItem[]> {
  const col = getAdminDb().collection('gallery')
  const q = activeOnly
    ? col.where('isActive', '==', true).orderBy('sortOrder')
    : col.orderBy('sortOrder')
  const snap = await q.get()
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as GalleryItem))
}

export async function getDeliveryPlatformsServer(): Promise<DeliveryPlatform[]> {
  const snap = await getAdminDb().collection('deliveryPlatforms').get()
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as DeliveryPlatform))
}
