'use client'

import { useEffect, useState } from 'react'
import { collection, query, orderBy, getDocs } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import Image from 'next/image'
import { Flame, Leaf, ShieldCheck } from 'lucide-react'
import { formatPrice } from '@/lib/utils'
import { SectionLoader } from '@/components/ui/LoadingSpinner'
import type { MenuItem, MenuCategory } from '@/types'

export function MenuContent() {
  const [categories, setCategories] = useState<MenuCategory[]>([])
  const [items, setItems] = useState<MenuItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const [catSnap, itemSnap] = await Promise.all([
          getDocs(query(collection(db, 'menuCategories'), orderBy('sortOrder'))),
          getDocs(query(collection(db, 'menuItems'), orderBy('sortOrder'))),
        ])
        setCategories(catSnap.docs.map((d) => ({ id: d.id, ...d.data() } as MenuCategory)))
        setItems(itemSnap.docs.map((d) => ({ id: d.id, ...d.data() } as MenuItem)))
      } catch (e) {
        console.error('Failed to load menu:', e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const activeCategories = categories.filter((c) => c.isActive)

  if (loading) {
    return <div className="py-20"><SectionLoader /></div>
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      {activeCategories.length === 0 ? (
        <div className="text-center py-20">
          <p className="font-serif text-2xl text-cream/30 italic">Menu coming soon</p>
        </div>
      ) : (
        <div className="space-y-16">
          {activeCategories.map((cat) => {
            const catItems = items.filter((i) => i.categoryId === cat.id && i.isAvailable)
            if (catItems.length === 0) return null
            return <CategorySection key={cat.id} category={cat} items={catItems} />
          })}
        </div>
      )}
    </div>
  )
}

function CategorySection({ category, items }: { category: MenuCategory; items: MenuItem[] }) {
  return (
    <div id={category.name.toLowerCase().replace(/\s+/g, '-')} className="scroll-mt-24">
      <div className="flex items-center gap-4 mb-8">
        <div>
          <h2 className="font-serif text-3xl text-cream">{category.name}</h2>
          {category.description && (
            <p className="text-sm text-cream/50 mt-1 italic">{category.description}</p>
          )}
        </div>
        <div className="flex-1 h-px bg-cream/10 ml-4" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {items.map((item) => (
          <MenuItemRow key={item.id} item={item} />
        ))}
      </div>
    </div>
  )
}

function MenuItemRow({ item }: { item: MenuItem }) {
  return (
    <div className="flex gap-4 p-4 bg-white/5 rounded-sm border border-cream/10 hover:border-cream/20 hover:bg-white/10 transition-all">
      {item.imageUrl && (
        <div className="w-20 h-20 rounded-sm overflow-hidden shrink-0 bg-white/10">
          <img
            src={item.imageUrl}
            alt={item.name}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-cream">{item.name}</h3>
            <div className="flex gap-1">
              {item.isSpicy && <Flame className="w-3.5 h-3.5 text-red-400 shrink-0" />}
              {item.isVegetarian && <Leaf className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
              {item.isGlutenFree && <ShieldCheck className="w-3.5 h-3.5 text-blue-400 shrink-0" />}
            </div>
          </div>
          <span className="text-gold font-bold whitespace-nowrap">{formatPrice(item.price)}</span>
        </div>
        {item.description && (
          <p className="text-sm text-cream/55 mt-1 leading-relaxed">{item.description}</p>
        )}
      </div>
    </div>
  )
}
