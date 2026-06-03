'use client'

import { useEffect, useState } from 'react'
import { getRestaurantSettings } from '@/lib/firestore'

export function AnnouncementBanner() {
  const [announcement, setAnnouncement] = useState('')
  const [active, setActive] = useState(false)

  useEffect(() => {
    getRestaurantSettings()
      .then((s) => {
        if (s?.announcementActive && s?.announcement) {
          setAnnouncement(s.announcement)
          setActive(true)
        }
      })
      .catch(() => {})
  }, [])

  if (!active || !announcement) return null

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-gold text-charcoal text-center py-2 text-sm font-medium">
      {announcement}
    </div>
  )
}
