'use client'

import { useEffect, useState } from 'react'
import { Award, Leaf, Clock } from 'lucide-react'
import { getRestaurantSettings } from '@/lib/firestore'
import { DEFAULT_SETTINGS } from '@/lib/utils'
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

export function AboutSection() {
  const [settings, setSettings] = useState<Partial<RestaurantSettings>>({
    aboutText: DEFAULT_SETTINGS.aboutText,
  })

  useEffect(() => {
    getRestaurantSettings()
      .then((s) => { if (s) setSettings(s) })
      .catch(() => {})
  }, [])

  return (
    <section id="about" className="py-24 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
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
              {settings.aboutText || DEFAULT_SETTINGS.aboutText}
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
