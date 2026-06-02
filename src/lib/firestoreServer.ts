import type {
  RestaurantSettings,
  MenuCategory,
  MenuItem,
  GalleryItem,
  DeliveryPlatform,
} from '@/types'

function getBaseUrl(): string {
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`
  return `http://localhost:${process.env.PORT ?? 3000}`
}

interface PublicData {
  settings: RestaurantSettings | null
  categories: MenuCategory[]
  items: MenuItem[]
  gallery: GalleryItem[]
  platforms: DeliveryPlatform[]
}

async function fetchPublicData(): Promise<PublicData> {
  const res = await fetch(`${getBaseUrl()}/api/public/data`, { cache: 'no-store' })
  if (!res.ok) throw new Error(`Public data fetch failed: ${res.status}`)
  return res.json()
}

export async function fetchAllPublicData(): Promise<PublicData> {
  return fetchPublicData()
}

export async function getRestaurantSettingsServer(): Promise<RestaurantSettings | null> {
  const data = await fetchPublicData()
  return data.settings
}

export async function getMenuCategoriesServer(): Promise<MenuCategory[]> {
  const data = await fetchPublicData()
  return data.categories
}

export async function getMenuItemsServer(): Promise<MenuItem[]> {
  const data = await fetchPublicData()
  return data.items
}

export async function getGalleryItemsServer(): Promise<GalleryItem[]> {
  const data = await fetchPublicData()
  return data.gallery
}

export async function getDeliveryPlatformsServer(): Promise<DeliveryPlatform[]> {
  const data = await fetchPublicData()
  return data.platforms
}
