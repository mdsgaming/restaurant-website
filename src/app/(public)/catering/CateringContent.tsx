'use client'

import { useState } from 'react'
import Link from 'next/link'
import { CheckCircle, Users, CalendarDays, UtensilsCrossed } from 'lucide-react'
import {
  CONTACT_TIMES,
  CONTACT_METHODS,
  EVENT_TYPES,
  SERVICE_STYLES,
  BUDGETS,
  MAX_GUESTS,
} from '@/lib/catering'

const INPUT =
  'w-full bg-white/5 border border-cream/20 rounded-sm px-3 py-2.5 text-base sm:text-sm text-cream placeholder-cream/30 focus:outline-none focus:border-gold transition-colors'
// Native selects need an explicit dark background so the open option list
// stays readable on the dark theme.
const SELECT = `${INPUT} [&>option]:bg-charcoal [&>option]:text-cream`
const LABEL = 'block text-xs font-medium text-cream/60 mb-1.5'

function todayLocal(): string {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

const EMPTY_FORM = {
  name: '',
  email: '',
  phone: '',
  contactMethod: 'PHONE',
  contactTime: 'ANYTIME',
  eventDate: '',
  eventTime: '',
  eventType: '',
  guestCount: '',
  eventLocation: '',
  serviceStyle: '',
  budget: 'UNSURE',
  menuInterests: '',
  dietaryNeeds: '',
  additionalDetails: '',
}

const HIGHLIGHTS = [
  { icon: Users, title: 'Any size event', text: 'From intimate gatherings to large celebrations.' },
  { icon: UtensilsCrossed, title: 'Authentic dishes', text: 'Jollof, suya, egusi, small chops and more, made fresh.' },
  { icon: CalendarDays, title: 'Pickup to full service', text: 'Drop-off, buffet setup, or staff on site.' },
]

export function CateringContent() {
  const [form, setForm] = useState(EMPTY_FORM)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  function set<K extends keyof typeof EMPTY_FORM>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/catering', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, guestCount: Number(form.guestCount) }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Something went wrong sending your request. Please try again or call us.')
      }
      setSuccess(true)
      setForm(EMPTY_FORM)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="pt-32 pb-24">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center mb-12">
        <p className="section-label">Catering Services</p>
        <div className="gold-divider" />
        <h1 className="section-heading mt-4 text-cream">
          Let Us <span className="italic text-primary-light">Cater</span> Your Event
        </h1>
        <p className="text-cream/60 mt-4 max-w-2xl mx-auto">
          Weddings, birthdays, office lunches, church events and more. Tell us about your event and our team will reach out at the time that suits you.
        </p>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-12">
          {HIGHLIGHTS.map(({ icon: Icon, title, text }) => (
            <div key={title} className="bg-white/5 border border-cream/10 rounded-sm p-5 text-center">
              <Icon className="w-6 h-6 text-gold mx-auto mb-2" aria-hidden="true" />
              <p className="text-cream font-medium text-sm">{title}</p>
              <p className="text-cream/50 text-xs mt-1">{text}</p>
            </div>
          ))}
        </div>

        {success ? (
          <div className="bg-white/5 border border-cream/10 rounded-sm p-10 text-center">
            <CheckCircle className="w-14 h-14 text-emerald-400 mx-auto mb-4" aria-hidden="true" />
            <h2 className="font-serif text-2xl text-cream mb-2">Request Received!</h2>
            <p className="text-cream/60 text-sm max-w-md mx-auto">
              Thank you. Our team will reach out at your preferred time to talk through your event and menu.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-6">
              <button
                type="button"
                onClick={() => setSuccess(false)}
                className="px-5 py-2.5 border border-cream/30 text-cream text-sm rounded-sm hover:bg-white/5 transition-colors"
              >
                Submit Another Request
              </button>
              <Link href="/menu" className="px-5 py-2.5 bg-gold text-charcoal font-semibold text-sm rounded-sm hover:bg-gold-dark transition-colors">
                Browse Our Menu
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-white/5 border border-cream/10 rounded-sm p-5 sm:p-8 space-y-8">
            <fieldset className="space-y-4">
              <legend className="font-serif text-xl text-cream mb-1">Your Details</legend>
              <div>
                <label htmlFor="c-name" className={LABEL}>Full Name *</label>
                <input id="c-name" required autoComplete="name" value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="e.g. Jane Doe" className={INPUT} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="c-email" className={LABEL}>Email *</label>
                  <input id="c-email" type="email" required autoComplete="email" spellCheck={false} value={form.email} onChange={(e) => set('email', e.target.value)} placeholder="you@example.com" className={INPUT} />
                </div>
                <div>
                  <label htmlFor="c-phone" className={LABEL}>Phone Number *</label>
                  <input id="c-phone" type="tel" required autoComplete="tel" value={form.phone} onChange={(e) => set('phone', e.target.value)} placeholder="e.g. (254) 350-6107" className={INPUT} />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="c-method" className={LABEL}>Best Way to Reach You *</label>
                  <select id="c-method" required value={form.contactMethod} onChange={(e) => set('contactMethod', e.target.value)} className={SELECT}>
                    {Object.entries(CONTACT_METHODS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </div>
                <div>
                  <label htmlFor="c-time" className={LABEL}>Best Time to Contact You *</label>
                  <select id="c-time" required value={form.contactTime} onChange={(e) => set('contactTime', e.target.value)} className={SELECT}>
                    {Object.entries(CONTACT_TIMES).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </div>
              </div>
            </fieldset>

            <fieldset className="space-y-4 pt-6 border-t border-cream/10">
              <legend className="font-serif text-xl text-cream mb-1">Event Details</legend>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="c-date" className={LABEL}>Event Date *</label>
                  <input id="c-date" type="date" required min={todayLocal()} value={form.eventDate} onChange={(e) => set('eventDate', e.target.value)} className={`${INPUT} [color-scheme:dark]`} />
                </div>
                <div>
                  <label htmlFor="c-start" className={LABEL}>Event Start Time</label>
                  <input id="c-start" type="time" value={form.eventTime} onChange={(e) => set('eventTime', e.target.value)} className={`${INPUT} [color-scheme:dark]`} />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="c-type" className={LABEL}>Type of Event *</label>
                  <select id="c-type" required value={form.eventType} onChange={(e) => set('eventType', e.target.value)} className={SELECT}>
                    <option value="" disabled>Choose one…</option>
                    {Object.entries(EVENT_TYPES).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </div>
                <div>
                  <label htmlFor="c-guests" className={LABEL}>Number of Guests *</label>
                  <input id="c-guests" type="number" inputMode="numeric" required min={1} max={MAX_GUESTS} value={form.guestCount} onChange={(e) => set('guestCount', e.target.value)} placeholder="e.g. 50" className={INPUT} />
                </div>
              </div>
              <div>
                <label htmlFor="c-location" className={LABEL}>Event Location</label>
                <input id="c-location" autoComplete="street-address" value={form.eventLocation} onChange={(e) => set('eventLocation', e.target.value)} placeholder="Venue name or address, city" className={INPUT} />
              </div>
              <div>
                <label htmlFor="c-style" className={LABEL}>Service Style *</label>
                <select id="c-style" required value={form.serviceStyle} onChange={(e) => set('serviceStyle', e.target.value)} className={SELECT}>
                  <option value="" disabled>Choose one…</option>
                  {Object.entries(SERVICE_STYLES).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
            </fieldset>

            <fieldset className="space-y-4 pt-6 border-t border-cream/10">
              <legend className="font-serif text-xl text-cream mb-1">Food &amp; Budget</legend>
              <div>
                <label htmlFor="c-menu" className={LABEL}>Dishes You're Interested In</label>
                <textarea id="c-menu" rows={2} value={form.menuInterests} onChange={(e) => set('menuInterests', e.target.value)} placeholder="e.g. Jollof rice, suya, small chops platter…" className={`${INPUT} resize-none`} />
              </div>
              <div>
                <label htmlFor="c-diet" className={LABEL}>Allergies or Dietary Needs</label>
                <textarea id="c-diet" rows={2} value={form.dietaryNeeds} onChange={(e) => set('dietaryNeeds', e.target.value)} placeholder="e.g. 5 vegetarian guests, one nut allergy…" className={`${INPUT} resize-none`} />
              </div>
              <div>
                <label htmlFor="c-budget" className={LABEL}>Estimated Budget</label>
                <select id="c-budget" value={form.budget} onChange={(e) => set('budget', e.target.value)} className={SELECT}>
                  {Object.entries(BUDGETS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="c-details" className={LABEL}>Anything Else We Should Know?</label>
                <textarea id="c-details" rows={4} value={form.additionalDetails} onChange={(e) => set('additionalDetails', e.target.value)} placeholder="Theme, setup needs, equipment, timing…" className={`${INPUT} resize-none`} />
              </div>
            </fieldset>

            {error && <p role="alert" className="text-red-400 text-sm">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-gold text-charcoal font-bold text-sm rounded-sm hover:bg-gold/90 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? 'Sending Request…' : 'Request a Catering Quote'}
            </button>
            <p className="text-center text-xs text-cream/35">
              Prefer to talk now? Call us at{' '}
              <a href="tel:+12543506107" className="text-cream/60 underline hover:text-cream">+1 (254) 350-6107</a>
            </p>
          </form>
        )}
      </div>
    </div>
  )
}
