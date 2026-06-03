'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowDown, Star } from 'lucide-react'
import { getRestaurantSettings } from '@/lib/firestore'
import { DEFAULT_SETTINGS } from '@/lib/utils'
import type { RestaurantSettings } from '@/types'

export function HeroSection() {
  const [settings, setSettings] = useState<Partial<RestaurantSettings>>({
    heroTitle: DEFAULT_SETTINGS.heroTitle,
    heroSubtitle: DEFAULT_SETTINGS.heroSubtitle,
  })

  useEffect(() => {
    getRestaurantSettings()
      .then((s) => { if (s) setSettings(s) })
      .catch(() => {})
  }, [])

  const title = settings.heroTitle || DEFAULT_SETTINGS.heroTitle
  const subtitle = settings.heroSubtitle || DEFAULT_SETTINGS.heroSubtitle
  const featuredImage = settings.heroFeaturedImageUrl

  return (
    <section id="home" className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 hero-bg" />

      {/* Featured circle image */}
      {featuredImage && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[280px] h-[280px] rounded-full overflow-hidden pointer-events-none">
          <Image
            src={featuredImage}
            alt={title}
            fill
            className="object-cover opacity-70"
            sizes="280px"
          />
        </div>
      )}

      {/* Decorative rings */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full border border-gold/20 pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full border border-gold/10 pointer-events-none" />

      {/* Content */}
      <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
        <div className="flex items-center justify-center gap-2 mb-6 animate-fade-in">
          {[1, 2, 3, 4, 5].map((i) => (
            <Star key={i} className="w-4 h-4 fill-gold text-gold" />
          ))}
        </div>

        <p className="section-label text-gold mb-4 animate-fade-in">
          Fine Dining Experience
        </p>

        <h1 className="font-serif text-5xl sm:text-6xl md:text-7xl lg:text-8xl text-cream mb-6 leading-tight animate-fade-up">
          {title}
        </h1>

        <div className="gold-divider" />

        <p className="font-serif text-lg sm:text-xl md:text-2xl text-cream/80 italic mt-6 mb-10 animate-fade-up">
          {subtitle}
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-up">
          <Link
            href="/menu"
            className="w-full sm:w-auto px-8 py-4 bg-gold text-charcoal font-bold text-sm tracking-wider uppercase rounded-sm hover:bg-gold-dark transition-all duration-200 active:scale-95"
          >
            View Our Menu
          </Link>
          <Link
            href="/order"
            className="w-full sm:w-auto px-8 py-4 border border-cream/50 text-cream font-semibold text-sm tracking-wider uppercase rounded-sm hover:bg-cream hover:text-charcoal transition-all duration-200 active:scale-95"
          >
            Order Now
          </Link>
        </div>
      </div>

      {/* Scroll indicator */}
      <a
        href="#about"
        className="absolute bottom-10 left-1/2 -translate-x-1/2 text-cream/60 hover:text-gold transition-colors animate-bounce"
        aria-label="Scroll down"
      >
        <ArrowDown className="w-6 h-6" />
      </a>
    </section>
  )
}
