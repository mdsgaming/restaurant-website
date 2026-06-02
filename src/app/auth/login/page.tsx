'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { UtensilsCrossed, Eye, EyeOff } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { getRestaurantSettings } from '@/lib/firestore'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const { signIn } = useAuth()
  const router = useRouter()

  const [logoUrl, setLogoUrl] = useState<string | undefined>(undefined)

  useEffect(() => {
    getRestaurantSettings().then((s) => { if (s?.logoUrl) setLogoUrl(s.logoUrl) }).catch(() => {})
  }, [])

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email || !password) return
    setError('')
    setLoading(true)
    try {
      await signIn(email, password)
      toast.success('Welcome back!')
      router.push('/admin')
    } catch (err: unknown) {
      console.error('Sign in error:', err)
      const code = (err as { code?: string }).code
      const message = (err as { message?: string }).message
      if (code === 'auth/user-not-found' || code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
        setError('Invalid email or password.')
      } else if (code === 'auth/too-many-requests') {
        setError('Too many attempts. Please try again later.')
      } else {
        setError(`Error: ${code || message || 'Unknown error'}`)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-cream px-4">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="bg-white rounded-sm shadow-xl border border-charcoal/8 overflow-hidden">
          {/* Header */}
          <div className="bg-charcoal px-8 py-10 text-center">
            <div className="w-12 h-12 rounded-sm flex items-center justify-center mx-auto mb-4 overflow-hidden">
              {logoUrl ? (
                <Image src={logoUrl} alt="Logo" width={48} height={48} className="object-contain" />
              ) : (
                <div className="w-full h-full bg-gold flex items-center justify-center">
                  <UtensilsCrossed className="w-6 h-6 text-charcoal" />
                </div>
              )}
            </div>
            <h1 className="font-serif text-2xl text-cream">Staff Portal</h1>
            <p className="text-cream/50 text-sm mt-1">Big Treats African Restaurants</p>
          </div>

          {/* Form */}
          <div className="px-8 py-8">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-1.5">
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-base"
                  placeholder="you@restaurant.com"
                  autoComplete="email"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPw ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input-base pr-10"
                    placeholder="••••••••"
                    autoComplete="current-password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(!showPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    tabIndex={-1}
                  >
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-sm">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full py-3 mt-2 disabled:opacity-60"
              >
                {loading ? 'Signing in…' : 'Sign In'}
              </button>
            </form>
          </div>
        </div>

        <p className="text-center text-xs text-charcoal/40 mt-6">
          Staff accounts are created by your system administrator.
        </p>
      </div>
    </div>
  )
}
