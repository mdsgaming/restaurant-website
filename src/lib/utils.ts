import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { Timestamp } from 'firebase/firestore'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPrice(price: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(price)
}

export function formatDate(date: Timestamp | Date | string): string {
  let d: Date
  if (date instanceof Timestamp) {
    d = date.toDate()
  } else if (date instanceof Date) {
    d = date
  } else {
    d = new Date(date)
  }
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function formatDateTime(date: Timestamp | Date | string): string {
  let d: Date
  if (date instanceof Timestamp) {
    d = date.toDate()
  } else if (date instanceof Date) {
    d = date
  } else {
    d = new Date(date)
  }
  return d.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength).trim() + '…'
}

export function isValidUrl(url: string): boolean {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

export const DEFAULT_SETTINGS = {
  name: 'Big Treats African Restaurants',
  tagline: 'Authentic African Flavours, Served with Love',
  description:
    'Big Treats African Restaurants brings the bold, rich, and comforting tastes of Africa to your table. From smoky suya and slow-cooked stews to fragrant jollof rice, every dish is crafted with tradition and heart.',
  phone: '+1 (555) 123-4567',
  email: 'hello@bigtreats.com',
  address: '456 Heritage Avenue',
  city: 'Atlanta',
  state: 'GA',
  zip: '30301',
  mapEmbedUrl: '',
  logoUrl: '',
  heroImageUrl: '',
  heroTitle: 'Big Treats',
  heroSubtitle: 'Authentic African Flavours, Served with Love',
  aboutText:
    'Big Treats African Restaurants was founded on a simple mission — to share the warmth, colour, and depth of African cuisine with our community. Every recipe is rooted in tradition, passed down through generations and prepared fresh daily using the finest ingredients.',
  aboutChefName: 'Chef Adaeze Okonkwo',
  aboutChefTitle: 'Head Chef & Co-Founder',
  aboutImageUrl: '',
  hours: {
    monday: { open: '11:00', close: '22:00', closed: false },
    tuesday: { open: '11:00', close: '22:00', closed: false },
    wednesday: { open: '11:00', close: '22:00', closed: false },
    thursday: { open: '11:00', close: '22:00', closed: false },
    friday: { open: '11:00', close: '23:00', closed: false },
    saturday: { open: '10:00', close: '23:00', closed: false },
    sunday: { open: '10:00', close: '21:00', closed: false },
  },
  socialMedia: {
    facebook: '',
    instagram: '',
    twitter: '',
    yelp: '',
  },
  announcement: '',
  announcementActive: false,
  seoTitle: 'Big Treats African Restaurants — Authentic African Cuisine',
  seoDescription:
    'Big Treats African Restaurants serves authentic African cuisine including jollof rice, suya, egusi soup, and more. Order online or visit us today.',
}

export const DAYS_OF_WEEK = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
] as const

export function formatHour(time24: string): string {
  if (!time24) return ''
  const [hours, minutes] = time24.split(':').map(Number)
  const ampm = hours >= 12 ? 'PM' : 'AM'
  const h = hours % 12 || 12
  return `${h}:${String(minutes).padStart(2, '0')} ${ampm}`
}
