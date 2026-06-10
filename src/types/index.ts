import { Timestamp } from 'firebase/firestore'

// ─── User & Auth ───────────────────────────────────────────────────────────────

export type UserRole = 'DEVELOPER' | 'ADMIN' | 'ASSISTANT'

export interface AppUser {
  uid: string
  email: string
  name: string
  role: UserRole
  isActive: boolean
  createdAt: Timestamp | Date
  updatedAt?: Timestamp | Date
}

// ─── Restaurant Settings ───────────────────────────────────────────────────────

export interface DayHours {
  open: string
  close: string
  closed: boolean
}

export interface BusinessHours {
  monday: DayHours
  tuesday: DayHours
  wednesday: DayHours
  thursday: DayHours
  friday: DayHours
  saturday: DayHours
  sunday: DayHours
}

export interface SocialMedia {
  facebook: string
  instagram: string
  twitter: string
  yelp: string
}

export interface RestaurantSettings {
  name: string
  tagline: string
  description: string
  phone: string
  email: string
  address: string
  city: string
  state: string
  zip: string
  mapEmbedUrl: string
  logoUrl: string
  heroImageUrl: string
  heroFeaturedImageUrl: string
  heroTitle: string
  heroSubtitle: string
  aboutText: string
  aboutChefName: string
  aboutChefTitle: string
  aboutImageUrl: string
  hours: BusinessHours
  socialMedia: SocialMedia
  announcement: string
  announcementActive: boolean
  seoTitle: string
  seoDescription: string
}

// ─── Menu ──────────────────────────────────────────────────────────────────────

export interface MenuCategory {
  id: string
  name: string
  description: string
  sortOrder: number
  isActive: boolean
  createdAt: Timestamp | Date
}

export interface MenuItem {
  id: string
  categoryId: string
  name: string
  description: string
  price: number
  imageUrl: string
  isAvailable: boolean
  isSpicy: boolean
  isVegetarian: boolean
  isGlutenFree: boolean
  isFeatured: boolean
  sortOrder: number
  createdAt: Timestamp | Date
}

// ─── Gallery ───────────────────────────────────────────────────────────────────

export type MediaType = 'IMAGE' | 'VIDEO'

export interface GalleryItem {
  id: string
  type: MediaType
  url: string
  thumbnailUrl?: string
  caption: string
  sortOrder: number
  isActive: boolean
  createdAt: Timestamp | Date
}

// ─── Delivery Platforms ────────────────────────────────────────────────────────

export type PlatformKey = 'UBER_EATS' | 'DOORDASH' | 'GRUBHUB'

export interface DeliveryPlatform {
  id: string
  platform: PlatformKey
  displayName: string
  url: string
  isActive: boolean
}

// ─── Approval Workflow ────────────────────────────────────────────────────────

export type ChangeType =
  | 'GALLERY_ADD'
  | 'GALLERY_REMOVE'
  | 'GALLERY_EDIT'
  | 'TEXT_CHANGE'
  | 'MENU_ITEM_ADD'
  | 'MENU_ITEM_EDIT'
  | 'MENU_ITEM_REMOVE'

export type ApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED'

export interface PendingChange {
  id: string
  type: ChangeType
  description: string
  data: Record<string, unknown>
  status: ApprovalStatus
  submittedById: string
  submittedByName: string
  reviewedById?: string
  reviewedByName?: string
  reviewNote?: string
  createdAt: Timestamp | Date
  updatedAt: Timestamp | Date
}

// ─── Audit Logs ────────────────────────────────────────────────────────────────

export interface AuditLog {
  id: string
  userId: string
  userName: string
  userRole: UserRole
  action: string
  resource: string
  details?: Record<string, unknown>
  createdAt: Timestamp | Date
}

// ─── Orders ────────────────────────────────────────────────────────────────────

export type OrderStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'
export type OrderType = 'DINE_IN' | 'TAKEOUT'

export interface CartItem {
  id: string
  name: string
  price: number
  quantity: number
}

export interface OrderItem {
  itemId: string
  name: string
  price: number
  quantity: number
}

export interface Order {
  id: string
  customerName: string
  customerPhone: string
  orderType: OrderType
  items: OrderItem[]
  notes?: string
  status: OrderStatus
  total: number
  createdAt: string | Timestamp | Date
  updatedAt: string | Timestamp | Date
}

// ─── Analytics ────────────────────────────────────────────────────────────────

export interface AnalyticsSummary {
  totalMenuItems: number
  totalGalleryItems: number
  pendingApprovals: number
  totalUsers: number
  recentLogs: AuditLog[]
}
