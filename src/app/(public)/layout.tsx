export const dynamic = 'force-dynamic'

import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { CartProvider } from '@/contexts/CartContext'
import { CartDrawer } from '@/components/public/CartDrawer'

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <CartProvider>
      <Header />
      <main>{children}</main>
      <CartDrawer />
      <Footer />
    </CartProvider>
  )
}
