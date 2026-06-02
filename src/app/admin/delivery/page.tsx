'use client'

import { useEffect, useState } from 'react'
import { Save, ExternalLink, CheckCircle, XCircle } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { getDeliveryPlatforms, upsertDeliveryPlatform, addAuditLog } from '@/lib/firestore'
import { isValidUrl } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import type { DeliveryPlatform, PlatformKey } from '@/types'
import toast from 'react-hot-toast'
import { SectionLoader } from '@/components/ui/LoadingSpinner'

const PLATFORM_DEFS: {
  key: PlatformKey
  name: string
  description: string
  placeholder: string
  colorClass: string
  logo: string
}[] = [
  {
    key: 'UBER_EATS',
    name: 'Uber Eats',
    description: "Paste your restaurant's direct Uber Eats ordering URL.",
    placeholder: 'https://www.ubereats.com/store/your-restaurant/...',
    colorClass: 'bg-[#06C167]',
    logo: 'UE',
  },
  {
    key: 'DOORDASH',
    name: 'DoorDash',
    description: "Paste your restaurant's direct DoorDash ordering URL.",
    placeholder: 'https://www.doordash.com/store/your-restaurant/...',
    colorClass: 'bg-[#FF3008]',
    logo: 'DD',
  },
  {
    key: 'GRUBHUB',
    name: 'Grubhub',
    description: "Paste your restaurant's direct Grubhub ordering URL.",
    placeholder: 'https://www.grubhub.com/restaurant/your-restaurant/...',
    colorClass: 'bg-[#FF8000]',
    logo: 'GH',
  },
]

interface PlatformState {
  url: string
  isActive: boolean
  urlError: string
}

export default function AdminDeliveryPage() {
  const { appUser } = useAuth()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<PlatformKey | null>(null)
  const [platforms, setPlatforms] = useState<Record<PlatformKey, PlatformState>>({
    UBER_EATS: { url: '', isActive: false, urlError: '' },
    DOORDASH: { url: '', isActive: false, urlError: '' },
    GRUBHUB: { url: '', isActive: false, urlError: '' },
  })

  useEffect(() => {
    async function load() {
      try {
        const data = await getDeliveryPlatforms()
        const state: Record<PlatformKey, PlatformState> = {
          UBER_EATS: { url: '', isActive: false, urlError: '' },
          DOORDASH: { url: '', isActive: false, urlError: '' },
          GRUBHUB: { url: '', isActive: false, urlError: '' },
        }
        data.forEach((p) => {
          if (p.platform in state) {
            state[p.platform as PlatformKey] = { url: p.url || '', isActive: p.isActive, urlError: '' }
          }
        })
        setPlatforms(state)
      } catch { /* ignore */ }
      finally { setLoading(false) }
    }
    load()
  }, [])

  function setUrl(key: PlatformKey, url: string) {
    const urlError = url && !isValidUrl(url) ? 'Please enter a valid URL starting with https://' : ''
    setPlatforms((p) => ({ ...p, [key]: { ...p[key], url, urlError } }))
  }

  function setActive(key: PlatformKey, isActive: boolean) {
    setPlatforms((p) => ({ ...p, [key]: { ...p[key], isActive } }))
  }

  async function savePlatform(key: PlatformKey, def: typeof PLATFORM_DEFS[0]) {
    const state = platforms[key]
    if (state.url && !isValidUrl(state.url)) {
      toast.error('Invalid URL')
      return
    }
    setSaving(key)
    try {
      await upsertDeliveryPlatform(key, {
        platform: key,
        displayName: def.name,
        url: state.url,
        isActive: state.isActive && !!state.url,
      })
      await addAuditLog({
        userId: appUser!.uid,
        userName: appUser!.name,
        userRole: appUser!.role,
        action: `updated ${def.name} delivery link`,
        resource: 'delivery',
        details: { platform: key, isActive: state.isActive },
      })
      toast.success(`${def.name} saved!`)
    } catch {
      toast.error('Failed to save')
    } finally {
      setSaving(null)
    }
  }

  if (loading) return <SectionLoader />

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="font-serif text-2xl text-charcoal">Delivery Platform Integration</h1>
        <p className="text-sm text-charcoal/50 mt-0.5">
          Connect your restaurant's pages on each delivery platform. Customers will be directed to these links when they click &ldquo;Order Now&rdquo;.
        </p>
      </div>

      <div className="space-y-4">
        {PLATFORM_DEFS.map((def) => {
          const state = platforms[def.key]
          const isConfigured = !!state.url && isValidUrl(state.url)

          return (
            <div key={def.key} className="admin-card">
              <div className="flex items-start gap-4">
                <div
                  className={`w-14 h-14 rounded-full flex items-center justify-center shrink-0 shadow-md ${def.colorClass}`}
                >
                  <span className="text-white font-bold text-lg">{def.logo}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <h2 className="font-semibold text-charcoal">{def.name}</h2>
                    {isConfigured ? (
                      <span className="flex items-center gap-1 text-xs text-emerald-600 font-medium">
                        <CheckCircle className="w-3.5 h-3.5" /> Connected
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-xs text-gray-400">
                        <XCircle className="w-3.5 h-3.5" /> Not configured
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 mb-4">{def.description}</p>

                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-gray-600">Ordering URL</label>
                      <div className="flex gap-2">
                        <input
                          type="url"
                          value={state.url}
                          onChange={(e) => setUrl(def.key, e.target.value)}
                          placeholder={def.placeholder}
                          className={`input-base text-sm flex-1 ${state.urlError ? 'border-red-400' : ''}`}
                        />
                        {isConfigured && (
                          <a href={state.url} target="_blank" rel="noreferrer"
                            aria-label={`Open ${def.name} page`}
                            className="px-3 py-2 border border-gray-200 rounded-sm text-gray-500 hover:text-primary hover:border-primary transition-colors">
                            <ExternalLink className="w-4 h-4" aria-hidden="true" />
                          </a>
                        )}
                      </div>
                      {state.urlError && <p className="text-xs text-red-600">{state.urlError}</p>}
                    </div>

                    <div className="flex items-center justify-between">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={state.isActive}
                          onChange={(e) => setActive(def.key, e.target.checked)}
                          className="w-4 h-4 accent-primary"
                          disabled={!isConfigured}
                        />
                        <span className="text-sm text-gray-600">
                          Show on Order page
                          {!isConfigured && <span className="text-gray-400 ml-1">(add URL first)</span>}
                        </span>
                      </label>
                      <Button
                        size="sm"
                        onClick={() => savePlatform(def.key, def)}
                        loading={saving === def.key}
                      >
                        <Save className="w-3.5 h-3.5" /> Save
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="p-4 bg-blue-50 border border-blue-100 rounded-sm text-sm text-blue-700">
        <strong>How to find your restaurant URL:</strong> Open the delivery platform app, navigate to your restaurant's page, and copy the URL from your browser address bar.
      </div>
    </div>
  )
}
