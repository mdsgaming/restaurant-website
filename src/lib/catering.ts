// Shared catering request options. Used by the public form, the API route
// that validates submissions, and the admin catering page, so the allowed
// values and their labels live in one place.

export const CONTACT_TIMES = {
  MORNING: 'Morning (9am – 12pm)',
  AFTERNOON: 'Afternoon (12pm – 5pm)',
  EVENING: 'Evening (5pm – 8pm)',
  ANYTIME: 'Anytime',
} as const

export const CONTACT_METHODS = {
  PHONE: 'Phone call',
  TEXT: 'Text message',
  EMAIL: 'Email',
} as const

export const EVENT_TYPES = {
  WEDDING: 'Wedding',
  BIRTHDAY: 'Birthday',
  CORPORATE: 'Corporate / office',
  GRADUATION: 'Graduation',
  RELIGIOUS: 'Church / religious event',
  FUNERAL: 'Funeral / memorial',
  OTHER: 'Other',
} as const

export const SERVICE_STYLES = {
  PICKUP: "I'll pick it up",
  DROPOFF: 'Delivery / drop-off',
  BUFFET: 'Delivery with buffet setup',
  FULL_SERVICE: 'Full service with staff',
} as const

export const BUDGETS = {
  UNSURE: 'Not sure yet',
  UNDER_500: 'Under $500',
  FROM_500: '$500 – $1,500',
  FROM_1500: '$1,500 – $5,000',
  OVER_5000: 'Over $5,000',
} as const

export const CATERING_STATUSES = {
  NEW: 'New',
  CONTACTED: 'Contacted',
  BOOKED: 'Booked',
  DECLINED: 'Declined',
} as const

export type ContactTime = keyof typeof CONTACT_TIMES
export type ContactMethod = keyof typeof CONTACT_METHODS
export type EventType = keyof typeof EVENT_TYPES
export type ServiceStyle = keyof typeof SERVICE_STYLES
export type Budget = keyof typeof BUDGETS
export type CateringStatus = keyof typeof CATERING_STATUSES

export interface CateringRequest {
  id: string
  name: string
  email: string
  phone: string
  contactMethod: ContactMethod
  contactTime: ContactTime
  eventDate: string // YYYY-MM-DD
  eventTime: string // HH:MM, or '' if not given
  eventType: EventType
  guestCount: number
  serviceStyle: ServiceStyle
  eventLocation: string
  budget: Budget
  dietaryNeeds: string
  menuInterests: string
  additionalDetails: string
  status: CateringStatus
  adminNotes: string
  createdAt: string
}

export const MAX_GUESTS = 5000

/** True if `value` is one of the keys of `options`. */
export function isOption<T extends Record<string, string>>(options: T, value: unknown): value is keyof T {
  return typeof value === 'string' && Object.prototype.hasOwnProperty.call(options, value)
}
