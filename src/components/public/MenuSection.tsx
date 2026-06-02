import Link from 'next/link'
import Image from 'next/image'
import { Flame, Leaf, ArrowRight } from 'lucide-react'
import { formatPrice } from '@/lib/utils'
import type { MenuCategory, MenuItem } from '@/types'

interface MenuSectionProps {
  categories: MenuCategory[]
  items: MenuItem[]
}

export function MenuSection({ categories, items }: MenuSectionProps) {
  const activeCategories = categories.filter((c) => c.isActive).slice(0, 4)
  const featuredItems = items.filter((i) => i.isFeatured && i.isAvailable).slice(0, 8)
  const displayItems = featuredItems.length > 0 ? featuredItems : items.filter(i => i.isAvailable).slice(0, 8)

  return (
    <section id="menu" className="py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <p className="section-label">What We Serve</p>
          <div className="gold-divider" />
          <h2 className="section-heading mt-4 text-cream">
            Our <span className="italic text-primary-light">Signature</span> Menu
          </h2>
          <p className="text-cream/60 mt-4 max-w-2xl mx-auto">
            Each dish is crafted with seasonal ingredients, balancing classic technique with modern flair.
          </p>
        </div>

        {/* Category chips */}
        {activeCategories.length > 0 && (
          <div className="flex flex-wrap justify-center gap-3 mb-12">
            {activeCategories.map((cat) => (
              <Link
                key={cat.id}
                href={`/menu#${cat.name.toLowerCase().replace(/\s+/g, '-')}`}
                className="px-5 py-2 border border-cream/30 text-sm font-medium text-cream/70 rounded-full hover:bg-primary hover:text-cream hover:border-primary transition-all duration-200"
              >
                {cat.name}
              </Link>
            ))}
          </div>
        )}

        {/* Menu items grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {displayItems.map((item) => (
            <MenuCard key={item.id} item={item} />
          ))}
        </div>

        <div className="text-center mt-12">
          <Link
            href="/menu"
            className="inline-flex items-center gap-2 px-8 py-3.5 border border-cream/40 text-cream font-semibold text-sm rounded-sm hover:bg-primary hover:border-primary transition-all duration-200"
          >
            View Full Menu <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  )
}

function MenuCard({ item }: { item: MenuItem }) {
  return (
    <div className="group overflow-hidden rounded-sm border border-cream/10 bg-white/5 hover:bg-white/10 transition-all duration-200">
      <div className="aspect-square relative bg-white/5 overflow-hidden">
        {item.imageUrl ? (
          <Image
            src={item.imageUrl}
            alt={item.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          />
        ) : (
          <div className="w-full h-full bg-primary/20 flex items-center justify-center">
            <span className="font-serif text-4xl text-cream/20">✦</span>
          </div>
        )}
        <div className="absolute top-3 right-3 flex gap-1.5">
          {item.isSpicy && (
            <span className="bg-red-600 text-white rounded-full p-1">
              <Flame className="w-3 h-3" />
            </span>
          )}
          {item.isVegetarian && (
            <span className="bg-emerald-600 text-white rounded-full p-1">
              <Leaf className="w-3 h-3" />
            </span>
          )}
        </div>
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-serif font-semibold text-cream text-base leading-tight">{item.name}</h3>
          <span className="text-gold font-semibold text-sm whitespace-nowrap">{formatPrice(item.price)}</span>
        </div>
        {item.description && (
          <p className="text-xs text-cream/55 mt-1.5 leading-relaxed line-clamp-2">{item.description}</p>
        )}
      </div>
    </div>
  )
}
