import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { getRestaurantSettings } from '@/lib/firestore'

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  let settings = null
  try {
    settings = await getRestaurantSettings()
  } catch {
    // Use defaults if Firestore unavailable
  }

  return (
    <>
      <Header restaurantName={settings?.name} logoUrl={settings?.logoUrl} />
      <main>{children}</main>
      <Footer settings={settings ?? undefined} />
    </>
  )
}
