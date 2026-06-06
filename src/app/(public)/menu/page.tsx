export const runtime = 'edge'
export const dynamic = 'force-dynamic'

import { Metadata } from 'next'
import { Flame, Leaf, ShieldCheck } from 'lucide-react'
import { MenuContent } from './MenuContent'

export const metadata: Metadata = {
  title: 'Menu',
  description: 'Browse our full seasonal menu with starters, mains, desserts and more.',
}

export default function MenuPage() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <div className="relative py-32 overflow-hidden">
        <div className="relative z-10 text-center">
          <p className="section-label text-gold">Our Kitchen</p>
          <div className="gold-divider" />
          <h1 className="font-serif text-5xl md:text-6xl text-cream mt-4">The Menu</h1>
          <p className="text-cream/60 mt-4 max-w-xl mx-auto font-serif italic text-lg">
            Seasonal ingredients, timeless recipes
          </p>
        </div>
      </div>

      {/* Legend */}
      <div className="border-b border-cream/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-wrap gap-6 justify-center text-xs text-cream/60">
          <span className="flex items-center gap-1.5"><Flame className="w-3.5 h-3.5 text-red-400" /> Spicy</span>
          <span className="flex items-center gap-1.5"><Leaf className="w-3.5 h-3.5 text-emerald-400" /> Vegetarian</span>
          <span className="flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5 text-blue-400" /> Gluten-Free</span>
        </div>
      </div>

      <MenuContent />
    </div>
  )
}
