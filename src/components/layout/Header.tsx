'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Menu, X, UtensilsCrossed, ShoppingBag } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getRestaurantSettings } from '@/lib/firestore'
import { useCart } from '@/contexts/CartContext'

const NAV_LINKS = [
  { label: 'Menu', href: '/menu' },
  { label: 'Gallery', href: '/gallery' },
  { label: 'About', href: '/#about' },
  { label: 'Contact', href: '/#contact' },
]

export function Header() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [restaurantName, setRestaurantName] = useState('Big Treats')
  const [logoUrl, setLogoUrl] = useState<string | undefined>(undefined)
  const { count, openCart } = useCart()

  useEffect(() => {
    function onScroll() { setScrolled(window.scrollY > 40) }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    getRestaurantSettings()
      .then((s) => {
        if (s?.name) setRestaurantName(s.name)
        if (s?.logoUrl) setLogoUrl(s.logoUrl)
      })
      .catch(() => {})
  }, [])

  return (
    <>
      <header
        className={cn(
          'fixed top-0 left-0 right-0 z-40 transition-all duration-300',
          scrolled
            ? 'bg-charcoal/95 backdrop-blur-sm shadow-lg py-3'
            : 'bg-transparent py-5'
        )}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2.5 group">
              {logoUrl ? (
                <Image src={logoUrl} alt={restaurantName} width={32} height={32} className="rounded-sm object-contain" />
              ) : (
                <div className="w-8 h-8 rounded-sm bg-gold flex items-center justify-center">
                  <UtensilsCrossed className="w-4 h-4 text-charcoal" />
                </div>
              )}
              <span className="font-serif text-xl text-cream font-semibold tracking-wide group-hover:text-gold transition-colors">
                {restaurantName}
              </span>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-8">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-sm text-cream/80 hover:text-gold transition-colors font-medium tracking-wide"
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            {/* CTA + Mobile toggle */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={openCart}
                className="relative p-2 text-cream/80 hover:text-gold transition-colors"
                aria-label="Open cart"
              >
                <ShoppingBag className="w-5 h-5" />
                {count > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-gold text-charcoal text-xs font-bold w-4 h-4 rounded-full flex items-center justify-center leading-none">
                    {count > 9 ? '9+' : count}
                  </span>
                )}
              </button>
              <Link
                href="/order"
                className="hidden sm:inline-flex items-center gap-2 px-5 py-2.5 bg-gold text-charcoal font-semibold text-sm rounded-sm hover:bg-gold-dark transition-colors"
              >
                Order Now
              </Link>
              <button
                type="button"
                className="md:hidden p-2 text-cream hover:text-gold transition-colors"
                onClick={() => setMobileOpen(!mobileOpen)}
                aria-label="Toggle menu"
              >
                {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      <div
        className={cn(
          'fixed inset-0 z-30 bg-charcoal flex flex-col pt-24 px-6 transition-all duration-300 md:hidden',
          mobileOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        )}
      >
        <nav className="flex flex-col gap-6">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className="font-serif text-2xl text-cream hover:text-gold transition-colors"
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/order"
            onClick={() => setMobileOpen(false)}
            className="mt-4 inline-flex items-center justify-center px-6 py-3.5 bg-gold text-charcoal font-bold text-lg rounded-sm hover:bg-gold-dark transition-colors"
          >
            Order Now
          </Link>
        </nav>
      </div>
    </>
  )
}
