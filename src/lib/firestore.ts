import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  Timestamp,
  writeBatch,
} from 'firebase/firestore'
import { db } from './firebase'
import type {
  RestaurantSettings,
  MenuCategory,
  MenuItem,
  GalleryItem,
  DeliveryPlatform,
  PendingChange,
  AuditLog,
  AppUser,
} from '@/types'

// ─── Settings ─────────────────────────────────────────────────────────────────

export async function getRestaurantSettings(): Promise<RestaurantSettings | null> {
  const snap = await getDoc(doc(db, 'settings', 'restaurant'))
  return snap.exists() ? (snap.data() as RestaurantSettings) : null
}

export async function updateRestaurantSettings(
  data: Partial<RestaurantSettings>
): Promise<void> {
  await setDoc(doc(db, 'settings', 'restaurant'), data, { merge: true })
}

// ─── Menu Categories ──────────────────────────────────────────────────────────

export async function getMenuCategories(): Promise<MenuCategory[]> {
  const q = query(collection(db, 'menuCategories'), orderBy('sortOrder'))
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as MenuCategory))
}

export async function addMenuCategory(
  data: Omit<MenuCategory, 'id' | 'createdAt'>
): Promise<string> {
  const ref = await addDoc(collection(db, 'menuCategories'), {
    ...data,
    createdAt: serverTimestamp(),
  })
  return ref.id
}

export async function updateMenuCategory(
  id: string,
  data: Partial<MenuCategory>
): Promise<void> {
  await updateDoc(doc(db, 'menuCategories', id), data)
}

export async function deleteMenuCategory(id: string): Promise<void> {
  await deleteDoc(doc(db, 'menuCategories', id))
}

// ─── Menu Items ───────────────────────────────────────────────────────────────

export async function getMenuItems(categoryId?: string): Promise<MenuItem[]> {
  let q
  if (categoryId) {
    q = query(
      collection(db, 'menuItems'),
      where('categoryId', '==', categoryId),
      orderBy('sortOrder')
    )
  } else {
    q = query(collection(db, 'menuItems'), orderBy('sortOrder'))
  }
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as MenuItem))
}

export async function addMenuItem(
  data: Omit<MenuItem, 'id' | 'createdAt'>
): Promise<string> {
  const ref = await addDoc(collection(db, 'menuItems'), {
    ...data,
    createdAt: serverTimestamp(),
  })
  return ref.id
}

export async function updateMenuItem(
  id: string,
  data: Partial<MenuItem>
): Promise<void> {
  await updateDoc(doc(db, 'menuItems', id), data)
}

export async function deleteMenuItem(id: string): Promise<void> {
  await deleteDoc(doc(db, 'menuItems', id))
}

// ─── Gallery ──────────────────────────────────────────────────────────────────

export async function getGalleryItems(activeOnly = false): Promise<GalleryItem[]> {
  let q
  if (activeOnly) {
    q = query(
      collection(db, 'gallery'),
      where('isActive', '==', true),
      orderBy('sortOrder')
    )
  } else {
    q = query(collection(db, 'gallery'), orderBy('sortOrder'))
  }
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as GalleryItem))
}

export async function addGalleryItem(
  data: Omit<GalleryItem, 'id' | 'createdAt'>
): Promise<string> {
  const ref = await addDoc(collection(db, 'gallery'), {
    ...data,
    createdAt: serverTimestamp(),
  })
  return ref.id
}

export async function updateGalleryItem(
  id: string,
  data: Partial<GalleryItem>
): Promise<void> {
  await updateDoc(doc(db, 'gallery', id), data)
}

export async function deleteGalleryItem(id: string): Promise<void> {
  await deleteDoc(doc(db, 'gallery', id))
}

// ─── Delivery Platforms ───────────────────────────────────────────────────────

export async function getDeliveryPlatforms(): Promise<DeliveryPlatform[]> {
  const snap = await getDocs(collection(db, 'deliveryPlatforms'))
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as DeliveryPlatform))
}

export async function upsertDeliveryPlatform(
  platform: string,
  data: Partial<DeliveryPlatform>
): Promise<void> {
  await setDoc(doc(db, 'deliveryPlatforms', platform), data, { merge: true })
}

// ─── Pending Changes ──────────────────────────────────────────────────────────

export async function getPendingChanges(
  statusFilter?: string
): Promise<PendingChange[]> {
  let q
  if (statusFilter) {
    q = query(
      collection(db, 'pendingChanges'),
      where('status', '==', statusFilter),
      orderBy('createdAt', 'desc')
    )
  } else {
    q = query(collection(db, 'pendingChanges'), orderBy('createdAt', 'desc'))
  }
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as PendingChange))
}

export async function submitPendingChange(
  data: Omit<PendingChange, 'id' | 'createdAt' | 'updatedAt' | 'status'>
): Promise<string> {
  const ref = await addDoc(collection(db, 'pendingChanges'), {
    ...data,
    status: 'PENDING',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  return ref.id
}

export async function reviewPendingChange(
  id: string,
  status: 'APPROVED' | 'REJECTED',
  reviewedById: string,
  reviewedByName: string,
  reviewNote?: string
): Promise<void> {
  await updateDoc(doc(db, 'pendingChanges', id), {
    status,
    reviewedById,
    reviewedByName,
    reviewNote: reviewNote || '',
    updatedAt: serverTimestamp(),
  })
}

// ─── Audit Logs ───────────────────────────────────────────────────────────────

export async function addAuditLog(
  data: Omit<AuditLog, 'id' | 'createdAt'>
): Promise<void> {
  await addDoc(collection(db, 'auditLogs'), {
    ...data,
    createdAt: serverTimestamp(),
  })
}

export async function getAuditLogs(limitCount = 50): Promise<AuditLog[]> {
  const q = query(
    collection(db, 'auditLogs'),
    orderBy('createdAt', 'desc')
  )
  const snap = await getDocs(q)
  return snap.docs.slice(0, limitCount).map((d) => ({ id: d.id, ...d.data() } as AuditLog))
}

// ─── Users ────────────────────────────────────────────────────────────────────

export async function getUserProfile(uid: string): Promise<AppUser | null> {
  const snap = await getDoc(doc(db, 'users', uid))
  return snap.exists() ? ({ uid: snap.id, ...snap.data() } as AppUser) : null
}

export async function getAllUsers(): Promise<AppUser[]> {
  const snap = await getDocs(collection(db, 'users'))
  return snap.docs.map((d) => ({ uid: d.id, ...d.data() } as AppUser))
}

export async function createUserProfile(
  uid: string,
  data: Omit<AppUser, 'uid' | 'createdAt'>
): Promise<void> {
  await setDoc(doc(db, 'users', uid), {
    ...data,
    createdAt: serverTimestamp(),
  })
}

export async function updateUserProfile(
  uid: string,
  data: Partial<AppUser>
): Promise<void> {
  await updateDoc(doc(db, 'users', uid), {
    ...data,
    updatedAt: serverTimestamp(),
  })
}
