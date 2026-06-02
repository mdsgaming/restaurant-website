import { Suspense } from 'react'
import { Metadata } from 'next'
import {
  getRestaurantSettings,
  getMenuCategories,
  getMenuItems,
  getGalleryItems,
  getDeliveryPlatforms,
} from '@/lib/firestore'
import { HeroSection } from '@/components/public/HeroSection'
import { AboutSection } from '@/components/public/AboutSection'
import { MenuSection } from '@/components/public/MenuSection'
import { GallerySection } from '@/components/public/GallerySection'
import { OrderSection } from '@/components/public/OrderSection'
import { HoursSection } from '@/components/public/HoursSection'
import { ContactSection } from '@/components/public/ContactSection'
import { DEFAULT_SETTINGS } from '@/lib/utils'

export async function generateMetadata(): Promise<Metadata> {
  try {
    const settings = await getRestaurantSettings()
    return {
      title: settings?.seoTitle || DEFAULT_SETTINGS.seoTitle,
      description: settings?.seoDescription || DEFAULT_SETTINGS.seoDescription,
    }
  } catch {
    return {
      title: DEFAULT_SETTINGS.seoTitle,
      description: DEFAULT_SETTINGS.seoDescription,
    }
  }
}

async function HomePageContent() {
  let settings = null
  let categories: Awaited<ReturnType<typeof getMenuCategories>> = []
  let items: Awaited<ReturnType<typeof getMenuItems>> = []
  let gallery: Awaited<ReturnType<typeof getGalleryItems>> = []
  let platforms: Awaited<ReturnType<typeof getDeliveryPlatforms>> = []

  try {
    ;[settings, categories, items, gallery, platforms] = await Promise.all([
      getRestaurantSettings(),
      getMenuCategories(),
      getMenuItems(),
      getGalleryItems(true),
      getDeliveryPlatforms(),
    ])
  } catch {
    // Render with defaults on error
  }

  const mergedSettings = { ...DEFAULT_SETTINGS, ...(settings || {}) }

  return (
    <>
      {/* Announcement banner */}
      {mergedSettings.announcementActive && mergedSettings.announcement && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-gold text-charcoal text-center py-2 text-sm font-medium">
          {mergedSettings.announcement}
        </div>
      )}

      <HeroSection settings={mergedSettings} />
      <AboutSection settings={mergedSettings} />
      <MenuSection categories={categories} items={items} />
      <GallerySection items={gallery} />
      <OrderSection platforms={platforms} />
      <HoursSection settings={mergedSettings} />
      <ContactSection settings={mergedSettings} />
    </>
  )
}

export default function HomePage() {
  return (
    <Suspense fallback={<div className="min-h-screen hero-bg" />}>
      <HomePageContent />
    </Suspense>
  )
}
