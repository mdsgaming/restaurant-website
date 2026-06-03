'use client'

import { useState, useEffect } from 'react'
import { Play, ZoomIn, X } from 'lucide-react'
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { GalleryItem } from '@/types'
import { SectionLoader } from '@/components/ui/LoadingSpinner'

type Filter = 'ALL' | 'IMAGE' | 'VIDEO'

export default function GalleryPage() {
  const [items, setItems] = useState<GalleryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<Filter>('ALL')
  const [lightbox, setLightbox] = useState<GalleryItem | null>(null)

  useEffect(() => {
    async function load() {
      try {
        const q = query(collection(db, 'gallery'), orderBy('sortOrder'))
        const snap = await getDocs(q)
        const all = snap.docs.map((d) => ({ id: d.id, ...d.data() } as GalleryItem))
        setItems(all.filter((i) => i.isActive))
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const filtered = filter === 'ALL' ? items : items.filter((i) => i.type === filter)

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <div className="relative py-32">
        <div className="relative z-10 text-center">
          <p className="section-label text-gold">Visuals</p>
          <div className="gold-divider" />
          <h1 className="font-serif text-5xl md:text-6xl text-cream mt-4">Gallery</h1>
        </div>
      </div>

      {/* Filters */}
      <div className="sticky top-16 z-20 border-b border-cream/10 bg-black/20 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center gap-3">
          {(['ALL', 'IMAGE', 'VIDEO'] as Filter[]).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={`px-5 py-2 text-sm font-medium rounded-full transition-colors ${
                filter === f
                  ? 'bg-primary text-cream'
                  : 'text-cream/60 hover:text-cream'
              }`}
            >
              {f === 'ALL' ? 'All' : f === 'IMAGE' ? 'Photos' : 'Videos'}
            </button>
          ))}
          <span className="ml-auto text-xs text-cream/40">{filtered.length} items</span>
        </div>
      </div>

      {/* Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {loading ? (
          <SectionLoader />
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <p className="font-serif text-2xl text-cream/30 italic">No items yet</p>
          </div>
        ) : (
          <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4 space-y-4">
            {filtered.map((item, idx) => (
              <div
                key={item.id}
                className={`break-inside-avoid relative group cursor-pointer overflow-hidden rounded-sm bg-white/5 border border-cream/10 ${
                  idx % 5 === 0 || idx % 5 === 3 ? 'aspect-[3/4]' : 'aspect-square'
                }`}
                onClick={() => setLightbox(item)}
              >
                {item.type === 'VIDEO' ? (
                  <div className="w-full h-full flex items-center justify-center">
                    <Play className="w-14 h-14 text-cream/60" />
                  </div>
                ) : (
                  <img
                    src={item.url}
                    alt={item.caption || ''}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                )}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors duration-300 flex items-center justify-center">
                  {item.type === 'VIDEO'
                    ? <Play className="w-10 h-10 text-cream opacity-0 group-hover:opacity-100 transition-opacity" />
                    : <ZoomIn className="w-8 h-8 text-cream opacity-0 group-hover:opacity-100 transition-opacity" />
                  }
                </div>
                {item.caption && (
                  <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                    <p className="text-cream text-xs">{item.caption}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}
        >
          <button
            type="button"
            aria-label="Close"
            className="absolute top-4 right-4 text-cream/60 hover:text-cream p-2 z-10"
            onClick={() => setLightbox(null)}
          >
            <X className="w-8 h-8" />
          </button>
          <div
            className="max-w-5xl max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {lightbox.type === 'VIDEO' ? (
              <video src={lightbox.url} controls autoPlay className="max-h-[85vh] max-w-full rounded" />
            ) : (
              <img src={lightbox.url} alt={lightbox.caption || ''} className="max-h-[85vh] max-w-full object-contain rounded" />
            )}
            {lightbox.caption && (
              <p className="text-center text-cream/70 text-sm mt-3">{lightbox.caption}</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
