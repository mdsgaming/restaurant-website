'use client'

export const runtime = 'edge'

import { useEffect, useState } from 'react'
import { collection, getDocs } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { DeliveryPlatform } from '@/types'
import { SectionLoader } from '@/components/ui/LoadingSpinner'
import { ExternalLink, Phone } from 'lucide-react'

const PLATFORM_META: Record<string, {
  name: string
  description: string
  bgColor: string
  dotColor: string
  initials: string
  features: string[]
}> = {
  UBER_EATS: {
    name: 'Uber Eats',
    description: 'Fast, reliable delivery with real-time tracking.',
    bgColor: 'bg-[#06C167]',
    dotColor: 'bg-[#06C167]',
    initials: 'UE',
    features: ['Real-time order tracking', 'No-contact delivery option', 'Scheduled orders'],
  },
  DOORDASH: {
    name: 'DoorDash',
    description: 'America\'s largest delivery platform with DashPass rewards.',
    bgColor: 'bg-[#FF3008]',
    dotColor: 'bg-[#FF3008]',
    initials: 'DD',
    features: ['DashPass membership savings', 'Schedule delivery', 'Easy re-ordering'],
  },
  GRUBHUB: {
    name: 'Grubhub',
    description: 'Order and earn rewards on every delivery.',
    bgColor: 'bg-[#FF8000]',
    dotColor: 'bg-[#FF8000]',
    initials: 'GH',
    features: ['Grubhub+ rewards program', 'Free delivery on qualifying orders', 'Group ordering'],
  },
}

export default function OrderPage() {
  const [platforms, setPlatforms] = useState<DeliveryPlatform[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const snap = await getDocs(collection(db, 'deliveryPlatforms'))
        setPlatforms(snap.docs.map((d) => ({ id: d.id, ...d.data() } as DeliveryPlatform)))
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const active = platforms.filter((p) => p.isActive && p.url)

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <div className="relative py-32 overflow-hidden">
        <div className="absolute inset-0 hero-bg opacity-80" />
        <div className="relative z-10 text-center">
          <p className="section-label text-gold">Delivery</p>
          <div className="gold-divider" />
          <h1 className="font-serif text-5xl md:text-6xl text-cream mt-4">Order Now</h1>
          <p className="text-cream/60 mt-4 text-lg font-serif italic">
            Delivered fresh to your door
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        {loading ? (
          <SectionLoader />
        ) : active.length === 0 ? (
          <div className="text-center py-16 space-y-4">
            <div className="w-20 h-20 bg-gold/10 rounded-full flex items-center justify-center mx-auto">
              <Phone className="w-8 h-8 text-gold" />
            </div>
            <h2 className="font-serif text-2xl text-cream">Online Ordering Coming Soon</h2>
            <p className="text-cream/60">Call us to place an order or visit us in person.</p>
            <a
              href="tel:+15551234567"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gold text-charcoal font-semibold rounded-sm hover:bg-gold-dark transition-colors"
            >
              <Phone className="w-4 h-4" /> Call to Order
            </a>
          </div>
        ) : (
          <>
            <h2 className="text-center font-serif text-2xl text-cream mb-3">
              Choose Your Delivery Platform
            </h2>
            <p className="text-center text-cream/50 text-sm mb-12">
              Click a platform below to be taken directly to our menu on that app.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {active.map((platform) => {
                const meta = PLATFORM_META[platform.platform] ?? {
                  name: platform.displayName,
                  description: 'Order online',
                  bgColor: 'bg-gray-700',
                  dotColor: 'bg-gray-700',
                  initials: platform.displayName.slice(0, 2).toUpperCase(),
                  features: [],
                }
                return (
                  <a
                    key={platform.id}
                    href={platform.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group bg-white/5 rounded-sm border border-cream/10 p-8 flex flex-col items-center text-center hover:bg-white/10 hover:border-gold/30 hover:-translate-y-2 transition-all duration-300"
                  >
                    <div className={`w-20 h-20 rounded-full ${meta.bgColor} flex items-center justify-center mb-5 shadow-lg`}>
                      <span className="text-white font-bold text-2xl">{meta.initials}</span>
                    </div>
                    <h3 className="font-serif text-2xl text-cream mb-2">{meta.name}</h3>
                    <p className="text-sm text-cream/55 mb-5 leading-relaxed">{meta.description}</p>
                    <ul className="text-xs text-cream/40 space-y-1.5 mb-6 text-left w-full">
                      {meta.features.map((f) => (
                        <li key={f} className="flex items-center gap-2">
                          <span className={`w-1.5 h-1.5 rounded-full ${meta.dotColor} shrink-0`} />
                          {f}
                        </li>
                      ))}
                    </ul>
                    <span className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 bg-gold text-charcoal font-semibold text-sm rounded-sm group-hover:bg-gold-dark transition-colors">
                      Order on {meta.name} <ExternalLink className="w-3.5 h-3.5" />
                    </span>
                  </a>
                )
              })}
            </div>

            <p className="text-center text-cream/30 text-xs mt-10">
              You will be redirected to the selected platform's website. Pricing and availability may vary.
            </p>
          </>
        )}
      </div>
    </div>
  )
}
