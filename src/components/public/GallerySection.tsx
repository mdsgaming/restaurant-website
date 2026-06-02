'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Play, X, ArrowRight, ZoomIn } from 'lucide-react'
import type { GalleryItem } from '@/types'

export function GallerySection({ items }: { items: GalleryItem[] }) {
  const [lightbox, setLightbox] = useState<GalleryItem | null>(null)
  const displayItems = items.filter((i) => i.isActive).slice(0, 9)

  return (
    <section id="gallery" className="py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <p className="section-label">Visual Journey</p>
          <div className="gold-divider" />
          <h2 className="section-heading mt-4 text-cream">
            Our <span className="italic text-primary-light">Gallery</span>
          </h2>
          <p className="text-cream/60 mt-4 max-w-xl mx-auto">
            A glimpse into the artistry, ambiance, and flavors that define Big Treats.
          </p>
        </div>

        {/* Masonry grid */}
        {displayItems.length === 0 ? (
          <div className="text-center py-16 text-charcoal/40">
            <p className="font-serif text-xl italic">Gallery coming soon</p>
          </div>
        ) : (
          <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 space-y-4">
            {displayItems.map((item, idx) => (
              <GalleryCard
                key={item.id}
                item={item}
                tall={idx % 5 === 0 || idx % 5 === 3}
                onClick={() => setLightbox(item)}
              />
            ))}
          </div>
        )}

        {items.length > 9 && (
          <div className="text-center mt-12">
            <Link
              href="/gallery"
              className="inline-flex items-center gap-2 px-8 py-3.5 border border-cream/40 text-cream font-semibold text-sm rounded-sm hover:bg-primary hover:border-primary transition-all duration-200"
            >
              View Full Gallery <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 bg-charcoal/95 flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}
        >
          <button
            className="absolute top-4 right-4 text-cream/60 hover:text-cream p-2"
            onClick={() => setLightbox(null)}
          >
            <X className="w-8 h-8" />
          </button>
          <div
            className="max-w-5xl max-h-[90vh] relative"
            onClick={(e) => e.stopPropagation()}
          >
            {lightbox.type === 'VIDEO' ? (
              <video
                src={lightbox.url}
                controls
                autoPlay
                className="max-h-[85vh] max-w-full rounded"
              />
            ) : (
              <img
                src={lightbox.url}
                alt={lightbox.caption || ''}
                className="max-h-[85vh] max-w-full object-contain rounded"
              />
            )}
            {lightbox.caption && (
              <p className="text-center text-cream/70 text-sm mt-3">{lightbox.caption}</p>
            )}
          </div>
        </div>
      )}
    </section>
  )
}

function GalleryCard({
  item,
  tall,
  onClick,
}: {
  item: GalleryItem
  tall: boolean
  onClick: () => void
}) {
  return (
    <div
      className={`break-inside-avoid relative group cursor-pointer overflow-hidden rounded-sm bg-gray-200 ${
        tall ? 'aspect-[3/4]' : 'aspect-square'
      }`}
      onClick={onClick}
    >
      {item.type === 'VIDEO' ? (
        <div className="w-full h-full bg-charcoal flex items-center justify-center">
          <Play className="w-12 h-12 text-cream/60" />
        </div>
      ) : (
        <Image
          src={item.url}
          alt={item.caption || ''}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-500"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />
      )}
      <div className="absolute inset-0 bg-charcoal/0 group-hover:bg-charcoal/40 transition-colors duration-300 flex items-center justify-center">
        <ZoomIn className="w-8 h-8 text-cream opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>
      {item.caption && (
        <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-charcoal/80 to-transparent translate-y-full group-hover:translate-y-0 transition-transform duration-300">
          <p className="text-cream text-xs">{item.caption}</p>
        </div>
      )}
    </div>
  )
}
