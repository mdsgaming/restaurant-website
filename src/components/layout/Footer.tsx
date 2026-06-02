'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { UtensilsCrossed, Facebook, Instagram, Twitter, MapPin, Phone, Mail } from 'lucide-react'
import { getRestaurantSettings } from '@/lib/firestore'
import type { RestaurantSettings } from '@/types'
import { DEFAULT_SETTINGS } from '@/lib/utils'

export function Footer() {
  const [settings, setSettings] = useState<Partial<RestaurantSettings>>(DEFAULT_SETTINGS)

  useEffect(() => {
    getRestaurantSettings()
      .then((s) => { if (s) setSettings(s) })
      .catch(() => {})
  }, [])

  const name = settings.name || DEFAULT_SETTINGS.name
  const address = settings.address || DEFAULT_SETTINGS.address
  const city = settings.city || DEFAULT_SETTINGS.city
  const state = settings.state || DEFAULT_SETTINGS.state
  const phone = settings.phone || DEFAULT_SETTINGS.phone
  const email = settings.email || DEFAULT_SETTINGS.email
  const social = settings.socialMedia

  return (
    <footer className="bg-black text-cream/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-2.5">
              {settings.logoUrl ? (
                <Image src={settings.logoUrl} alt={name} width={32} height={32} className="rounded-sm object-contain" />
              ) : (
                <div className="w-8 h-8 rounded-sm bg-gold flex items-center justify-center">
                  <UtensilsCrossed className="w-4 h-4 text-charcoal" />
                </div>
              )}
              <span className="font-serif text-xl text-cream font-semibold">{name}</span>
            </div>
            <p className="text-sm text-cream/60 leading-relaxed">
              {settings.tagline || DEFAULT_SETTINGS.tagline}
            </p>
            <div className="flex items-center gap-3 pt-2">
              {social?.instagram && (
                <a href={social.instagram} target="_blank" rel="noreferrer"
                  aria-label="Follow us on Instagram"
                  className="w-9 h-9 border border-cream/20 rounded-full flex items-center justify-center hover:border-gold hover:text-gold transition-colors">
                  <Instagram className="w-4 h-4" aria-hidden="true" />
                </a>
              )}
              {social?.facebook && (
                <a href={social.facebook} target="_blank" rel="noreferrer"
                  aria-label="Follow us on Facebook"
                  className="w-9 h-9 border border-cream/20 rounded-full flex items-center justify-center hover:border-gold hover:text-gold transition-colors">
                  <Facebook className="w-4 h-4" aria-hidden="true" />
                </a>
              )}
              {social?.twitter && (
                <a href={social.twitter} target="_blank" rel="noreferrer"
                  aria-label="Follow us on Twitter"
                  className="w-9 h-9 border border-cream/20 rounded-full flex items-center justify-center hover:border-gold hover:text-gold transition-colors">
                  <Twitter className="w-4 h-4" aria-hidden="true" />
                </a>
              )}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-serif text-cream text-base mb-4">Quick Links</h4>
            <ul className="space-y-2.5">
              {[
                { label: 'Home', href: '/' },
                { label: 'Menu', href: '/menu' },
                { label: 'Gallery', href: '/gallery' },
                { label: 'Order Now', href: '/order' },
                { label: 'About Us', href: '/#about' },
                { label: 'Contact', href: '/#contact' },
              ].map((link) => (
                <li key={link.href}>
                  <Link href={link.href}
                    className="text-sm text-cream/60 hover:text-gold transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Hours */}
          <div>
            <h4 className="font-serif text-cream text-base mb-4">Hours</h4>
            <ul className="space-y-1.5 text-sm text-cream/60">
              <li className="flex justify-between gap-4"><span>Mon–Thu</span><span>11 AM – 10 PM</span></li>
              <li className="flex justify-between gap-4"><span>Fri</span><span>11 AM – 11 PM</span></li>
              <li className="flex justify-between gap-4"><span>Sat</span><span>10 AM – 11 PM</span></li>
              <li className="flex justify-between gap-4"><span>Sun</span><span>10 AM – 9 PM</span></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-serif text-cream text-base mb-4">Contact</h4>
            <ul className="space-y-3">
              <li className="flex items-start gap-3 text-sm text-cream/60">
                <MapPin className="w-4 h-4 mt-0.5 shrink-0 text-gold" />
                <span>{address}<br />{city}, {state}</span>
              </li>
              <li className="flex items-center gap-3 text-sm text-cream/60">
                <Phone className="w-4 h-4 shrink-0 text-gold" />
                <a href={`tel:${phone}`} className="hover:text-gold transition-colors">{phone}</a>
              </li>
              <li className="flex items-center gap-3 text-sm text-cream/60">
                <Mail className="w-4 h-4 shrink-0 text-gold" />
                <a href={`mailto:${email}`} className="hover:text-gold transition-colors">{email}</a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-cream/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-cream/40">
          <p>© {new Date().getFullYear()} {name}. All rights reserved.</p>
          <Link href="/auth/login" className="hover:text-cream/60 transition-colors">
            Staff Login
          </Link>
        </div>
      </div>
    </footer>
  )
}
