'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import {
  User,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
} from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { getUserProfile } from '@/lib/firestore'
import type { AppUser, UserRole } from '@/types'

interface AuthContextValue {
  firebaseUser: User | null
  appUser: AppUser | null
  role: UserRole | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  refreshUser: () => Promise<void>
  isDeveloper: boolean
  isAdmin: boolean
  isAssistant: boolean
  canApprove: boolean
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null)
  const [appUser, setAppUser] = useState<AppUser | null>(null)
  const [loading, setLoading] = useState(true)

  async function loadAppUser(user: User) {
    try {
      const profile = await getUserProfile(user.uid)
      if (profile) {
        setAppUser(profile)
        return
      }
    } catch (e) {
      console.error('Firestore profile fetch failed, falling back to token claims:', e)
    }

    // Fallback: read role from Firebase custom claims on the ID token
    try {
      const token = await user.getIdTokenResult()
      const role = token.claims.role as UserRole | undefined
      if (role) {
        setAppUser({
          uid: user.uid,
          email: user.email ?? '',
          name: user.displayName ?? user.email ?? '',
          role,
          isActive: true,
          createdAt: new Date(),
        })
      } else {
        setAppUser(null)
      }
    } catch (e) {
      console.error('Failed to read token claims:', e)
      setAppUser(null)
    }
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user)
      if (user) {
        await loadAppUser(user)
      } else {
        setAppUser(null)
      }
      setLoading(false)
    })
    return unsubscribe
  }, [])

  async function signIn(email: string, password: string) {
    const cred = await signInWithEmailAndPassword(auth, email, password)
    const token = await cred.user.getIdToken()
    document.cookie = `__session=${token}; path=/; max-age=3600; SameSite=Strict`
    await loadAppUser(cred.user)
  }

  async function signOut() {
    await firebaseSignOut(auth)
    document.cookie = '__session=; path=/; max-age=0'
    setAppUser(null)
  }

  async function refreshUser() {
    if (firebaseUser) await loadAppUser(firebaseUser)
  }

  const role = appUser?.role ?? null
  const isDeveloper = role === 'DEVELOPER'
  const isAdmin = role === 'ADMIN' || role === 'DEVELOPER'
  const isAssistant = role === 'ASSISTANT'
  const canApprove = role === 'ADMIN' || role === 'DEVELOPER'

  return (
    <AuthContext.Provider
      value={{
        firebaseUser,
        appUser,
        role,
        loading,
        signIn,
        signOut,
        refreshUser,
        isDeveloper,
        isAdmin,
        isAssistant,
        canApprove,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
