import Link from 'next/link'
import type { DeliveryPlatform } from '@/types'

const PLATFORM_META = {
  UBER_EATS: {
    name: 'Uber Eats',
    color: 'bg-[#06C167]',
    textColor: 'text-white',
    logo: 'UE',
    description: 'Fast delivery · Track your order',
  },
  DOORDASH: {
    name: 'DoorDash',
    color: 'bg-[#FF3008]',
    textColor: 'text-white',
    logo: 'DD',
    description: 'Free delivery on first order',
  },
  GRUBHUB: {
    name: 'Grubhub',
    color: 'bg-[#FF8000]',
    textColor: 'text-white',
    logo: 'GH',
    description: 'Earn rewards with every order',
  },
}

export function OrderSection({ platforms, phone }: { platforms: DeliveryPlatform[]; phone?: string }) {
  const activePlatforms = platforms.filter((p) => p.isActive)

  return (
    <section id="order" className="py-24 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-white/5 -translate-y-32 translate-x-32" />
      <div className="absolute bottom-0 left-0 w-96 h-96 rounded-full bg-white/5 translate-y-48 -translate-x-48" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <p className="text-xs font-medium tracking-widest uppercase text-gold mb-3">
            Delivery Available
          </p>
          <div className="w-16 h-0.5 bg-gold mx-auto mb-6" />
          <h2 className="font-serif text-4xl md:text-5xl text-cream">
            Order <span className="italic">Wherever</span> You Are
          </h2>
          <p className="text-cream/70 mt-4 max-w-2xl mx-auto">
            Enjoy Big Treats&apos; full menu delivered straight to your door through your favourite delivery platform.
          </p>
        </div>

        {activePlatforms.length === 0 ? (
          <div className="text-center py-8">
            <Link
              href="/order"
              className="inline-flex items-center gap-2 px-8 py-4 bg-gold text-charcoal font-bold text-sm tracking-wider uppercase rounded-sm hover:bg-gold-dark transition-all duration-200 active:scale-95"
            >
              Order Now
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {activePlatforms.map((platform) => {
              const meta = PLATFORM_META[platform.platform] ?? {
                name: platform.displayName,
                color: 'bg-gray-700',
                textColor: 'text-white',
                logo: platform.displayName.slice(0, 2).toUpperCase(),
                description: 'Order online',
              }
              return (
                <a
                  key={platform.id}
                  href={platform.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group bg-white rounded-sm p-6 flex flex-col items-center text-center shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-200"
                >
                  <div className={`w-16 h-16 rounded-full ${meta.color} flex items-center justify-center mb-4`}>
                    <span className={`font-bold text-lg ${meta.textColor}`}>{meta.logo}</span>
                  </div>
                  <h3 className="font-serif text-xl text-charcoal mb-1">{meta.name}</h3>
                  <p className="text-xs text-charcoal/50 mb-4">{meta.description}</p>
                  <span className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-charcoal text-cream text-sm font-semibold rounded-sm group-hover:bg-primary transition-colors">
                    Order on {meta.name}
                  </span>
                </a>
              )
            })}
          </div>
        )}

        {phone && (
          <p className="text-center mt-10 text-cream/50 text-sm">
            Prefer to call? Reach us at{' '}
            <a href={`tel:${phone.replace(/\s+/g, '')}`} className="text-gold hover:underline font-medium">
              {phone}
            </a>
          </p>
        )}
      </div>
    </section>
  )
}
