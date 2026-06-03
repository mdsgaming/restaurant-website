'use client'

import { useEffect, useState } from 'react'
import { Clock } from 'lucide-react'
import { formatHour, DAYS_OF_WEEK, DEFAULT_SETTINGS } from '@/lib/utils'
import { getRestaurantSettings } from '@/lib/firestore'
import type { RestaurantSettings } from '@/types'

const DAY_LABELS: Record<string, string> = {
  monday: 'Monday',
  tuesday: 'Tuesday',
  wednesday: 'Wednesday',
  thursday: 'Thursday',
  friday: 'Friday',
  saturday: 'Saturday',
  sunday: 'Sunday',
}

const today = new Date()
  .toLocaleDateString('en-US', { weekday: 'long' })
  .toLowerCase()

export function HoursSection() {
  const [settings, setSettings] = useState<Partial<RestaurantSettings>>({
    hours: DEFAULT_SETTINGS.hours,
  })

  useEffect(() => {
    getRestaurantSettings()
      .then((s) => { if (s) setSettings(s) })
      .catch(() => {})
  }, [])

  const hours = settings.hours

  return (
    <section id="hours" className="py-24 text-cream">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <Clock className="w-10 h-10 text-gold mx-auto mb-4" />
          <p className="section-label text-gold">When to Visit</p>
          <div className="gold-divider" />
          <h2 className="font-serif text-4xl text-cream mt-4">Business Hours</h2>
        </div>

        <div className="bg-white/5 rounded-sm border border-cream/10 overflow-hidden">
          {DAYS_OF_WEEK.map((day, idx) => {
            const dayHours = hours?.[day]
            const isToday = day === today
            return (
              <div
                key={day}
                className={`flex items-center justify-between px-6 py-4 ${
                  idx !== DAYS_OF_WEEK.length - 1 ? 'border-b border-cream/10' : ''
                } ${isToday ? 'bg-gold/10' : ''}`}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`text-sm font-medium capitalize w-24 ${
                      isToday ? 'text-gold' : 'text-cream/80'
                    }`}
                  >
                    {DAY_LABELS[day]}
                  </span>
                  {isToday && (
                    <span className="text-xs px-2 py-0.5 bg-gold text-charcoal rounded-full font-semibold">
                      Today
                    </span>
                  )}
                </div>
                {dayHours?.closed ? (
                  <span className="text-sm text-cream/40 italic">Closed</span>
                ) : (
                  <span className={`text-sm ${isToday ? 'text-gold font-semibold' : 'text-cream/60'}`}>
                    {dayHours
                      ? `${formatHour(dayHours.open)} – ${formatHour(dayHours.close)}`
                      : '11:00 AM – 10:00 PM'}
                  </span>
                )}
              </div>
            )
          })}
        </div>

        <p className="text-center text-cream/40 text-sm mt-6">
          Hours may vary on holidays. Call to confirm.
        </p>
      </div>
    </section>
  )
}
