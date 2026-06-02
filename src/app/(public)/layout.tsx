export const dynamic = 'force-dynamic'

import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { getRestaurantSettingsServer } from '@/lib/firestoreServer'

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  let settings = null
  try {
    settings = await getRestaurantSettingsServer()
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
