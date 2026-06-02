import Image from 'next/image'
import { Award, Leaf, Clock } from 'lucide-react'
import type { RestaurantSettings } from '@/types'

const FEATURES = [
  {
    icon: Award,
    title: 'Award-Winning Cuisine',
    description: 'Recognized for culinary excellence and innovation in every dish we serve.',
  },
  {
    icon: Leaf,
    title: 'Locally Sourced',
    description: 'Fresh ingredients from trusted local farms and artisan producers.',
  },
  {
    icon: Clock,
    title: 'Open Daily',
    description: 'Serving lunch and dinner seven days a week, with warm hospitality.',
  },
]

export function AboutSection({ settings }: { settings?: Partial<RestaurantSettings> }) {
  return (
    <section id="about" className="py-24 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Image side */}
          <div className="relative">
            <div className="aspect-[4/5] rounded-sm overflow-hidden bg-white/5 relative border border-cream/10">
              {settings?.aboutImageUrl ? (
                <Image
                  src={settings.aboutImageUrl}
                  alt="About our restaurant"
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />
              ) : (
                <div className="w-full h-full hero-bg flex items-center justify-center">
                  <p className="text-cream/40 font-serif text-xl italic">Restaurant Photo</p>
                </div>
              )}
            </div>
            {/* Floating chef card */}
            <div className="absolute -bottom-6 -right-6 bg-white/10 backdrop-blur-sm p-5 shadow-xl rounded-sm border-l-4 border-gold max-w-[200px] border border-cream/20">
              <p className="font-serif text-base text-cream font-semibold">
                {settings?.aboutChefName || 'Chef Adaeze Okonkwo'}
              </p>
              <p className="text-xs text-cream/60 mt-1">
                {settings?.aboutChefTitle || 'Head Chef & Co-Founder'}
              </p>
            </div>
            {/* Year badge */}
            <div className="absolute -top-6 -left-6 w-20 h-20 bg-primary rounded-full flex flex-col items-center justify-center shadow-lg">
              <span className="font-serif text-gold font-bold text-2xl leading-none">15</span>
              <span className="text-cream/70 text-xs uppercase tracking-wider">Years</span>
            </div>
          </div>

          {/* Text side */}
          <div className="space-y-8">
            <div>
              <p className="section-label">Our Story</p>
              <div className="gold-divider-left" />
              <h2 className="section-heading mt-4 text-cream">
                Crafted with Passion,<br />
                <span className="italic text-primary-light">Served with Love</span>
              </h2>
            </div>

            <p className="text-cream/75 leading-relaxed text-lg">
              {settings?.aboutText ||
                'Founded with a passion for bringing the bold, rich, and comforting tastes of Africa to every table, Big Treats African Restaurants has been serving authentic flavours made from scratch using time-honoured family recipes.'}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-4">
              {FEATURES.map(({ icon: Icon, title, description }) => (
                <div key={title} className="space-y-2">
                  <div className="w-10 h-10 bg-primary/30 rounded-sm flex items-center justify-center">
                    <Icon className="w-5 h-5 text-gold" />
                  </div>
                  <h3 className="font-semibold text-cream text-sm">{title}</h3>
                  <p className="text-xs text-cream/60 leading-relaxed">{description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
