'use client'

import { useEffect, useState } from 'react'
import { Save, Globe, Clock, Share2, Megaphone } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { getRestaurantSettings, updateRestaurantSettings, addAuditLog } from '@/lib/firestore'
import { DEFAULT_SETTINGS, DAYS_OF_WEEK } from '@/lib/utils'
import { ImageUpload } from '@/components/ui/ImageUpload'
import { Button } from '@/components/ui/Button'
import type { RestaurantSettings } from '@/types'
import toast from 'react-hot-toast'
import { SectionLoader } from '@/components/ui/LoadingSpinner'

const DAY_LABELS: Record<string, string> = {
  monday: 'Monday', tuesday: 'Tuesday', wednesday: 'Wednesday',
  thursday: 'Thursday', friday: 'Friday', saturday: 'Saturday', sunday: 'Sunday',
}

export default function AdminSettingsPage() {
  const { appUser, isAdmin } = useAuth()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<'general' | 'hours' | 'social' | 'seo' | 'announcement'>('general')
  const [form, setForm] = useState<Partial<RestaurantSettings>>(DEFAULT_SETTINGS)

  useEffect(() => {
    async function load() {
      try {
        const settings = await getRestaurantSettings()
        if (settings) setForm({ ...DEFAULT_SETTINGS, ...settings })
      } catch { /* use defaults */ }
      finally { setLoading(false) }
    }
    load()
  }, [])

  function set<K extends keyof RestaurantSettings>(key: K, value: RestaurantSettings[K]) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  async function handleSave() {
    setSaving(true)
    try {
      await updateRestaurantSettings(form)
      await addAuditLog({
        userId: appUser!.uid,
        userName: appUser!.name,
        userRole: appUser!.role,
        action: 'updated restaurant settings',
        resource: 'settings',
        details: { tab: activeTab },
      })
      toast.success('Settings saved!')
    } catch (e) {
      toast.error('Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <SectionLoader />

  const tabs = [
    { key: 'general', label: 'General', icon: Globe },
    { key: 'hours', label: 'Hours', icon: Clock },
    { key: 'social', label: 'Social', icon: Share2 },
    { key: 'announcement', label: 'Banner', icon: Megaphone },
  ]

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl text-charcoal">Restaurant Settings</h1>
          <p className="text-sm text-charcoal/50 mt-0.5">Changes go live across the entire website immediately.</p>
        </div>
        <Button onClick={handleSave} loading={saving}>
          <Save className="w-4 h-4" /> Save Changes
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200">
        {tabs.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key as typeof activeTab)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
              activeTab === key
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Icon className="w-3.5 h-3.5" /> {label}
          </button>
        ))}
      </div>

      <div className="admin-card space-y-6">
        {activeTab === 'general' && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <Field label="Restaurant Name" value={form.name || ''} onChange={v => set('name', v)} placeholder="Big Treats African Restaurants" />
              <Field label="Tagline" value={form.tagline || ''} onChange={v => set('tagline', v)} placeholder="Where Every Meal..." />
            </div>
            <Field label="Description" value={form.description || ''} onChange={v => set('description', v)} placeholder="About the restaurant" multiline />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <Field label="Phone" value={form.phone || ''} onChange={v => set('phone', v)} type="tel" placeholder="+1 (555) 123-4567" />
              <Field label="Email" value={form.email || ''} onChange={v => set('email', v)} type="email" placeholder="hello@restaurant.com" />
            </div>
            <Field label="Street Address" value={form.address || ''} onChange={v => set('address', v)} placeholder="123 Main Street" />
            <div className="grid grid-cols-3 gap-4">
              <Field label="City" value={form.city || ''} onChange={v => set('city', v)} />
              <Field label="State" value={form.state || ''} onChange={v => set('state', v)} placeholder="CA" />
              <Field label="ZIP" value={form.zip || ''} onChange={v => set('zip', v)} placeholder="94102" />
            </div>
            <Field label="Google Maps Embed URL" value={form.mapEmbedUrl || ''} onChange={v => set('mapEmbedUrl', v)} placeholder="https://www.google.com/maps/embed?pb=..." hint="Paste the embed src URL from Google Maps" />

            <div className="border-t border-gray-100 pt-6 space-y-5">
              <h3 className="font-semibold text-charcoal text-sm">Branding</h3>
              <ImageUpload label="Restaurant Logo" onUpload={url => set('logoUrl', url)} currentUrl={form.logoUrl} folder="branding" />
              <ImageUpload label="Hero Background Image" onUpload={url => set('heroImageUrl', url)} currentUrl={form.heroImageUrl} folder="branding" />
              <ImageUpload label="Hero Circle Image" onUpload={url => set('heroFeaturedImageUrl', url)} currentUrl={form.heroFeaturedImageUrl} folder="branding" />
              <Field label="Hero Title" value={form.heroTitle || ''} onChange={v => set('heroTitle', v)} placeholder="Your Restaurant Name" />
              <Field label="Hero Subtitle" value={form.heroSubtitle || ''} onChange={v => set('heroSubtitle', v)} placeholder="Your tagline here" />
            </div>

            <div className="border-t border-gray-100 pt-6 space-y-5">
              <h3 className="font-semibold text-charcoal text-sm">About Section</h3>
              <Field label="About Text" value={form.aboutText || ''} onChange={v => set('aboutText', v)} multiline placeholder="Tell your restaurant's story..." />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <Field label="Chef Name" value={form.aboutChefName || ''} onChange={v => set('aboutChefName', v)} />
                <Field label="Chef Title" value={form.aboutChefTitle || ''} onChange={v => set('aboutChefTitle', v)} />
              </div>
              <ImageUpload label="About Section Image" onUpload={url => set('aboutImageUrl', url)} currentUrl={form.aboutImageUrl} folder="about" />
            </div>
          </>
        )}

        {activeTab === 'hours' && (
          <div className="space-y-3">
            <p className="text-sm text-gray-500">Set your weekly business hours. Toggle &quot;Closed&quot; for days off.</p>
            {DAYS_OF_WEEK.map((day) => {
              const dayHours = form.hours?.[day] ?? { open: '11:00', close: '22:00', closed: false }
              return (
                <div key={day} className="flex items-center gap-4 py-2 border-b border-gray-50 last:border-0">
                  <span className="w-28 text-sm font-medium text-charcoal capitalize">{DAY_LABELS[day]}</span>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={dayHours.closed}
                      onChange={(e) => set('hours', { ...form.hours!, [day]: { ...dayHours, closed: e.target.checked } })}
                      className="accent-primary"
                    />
                    <span className="text-xs text-gray-500">Closed</span>
                  </label>
                  {!dayHours.closed && (
                    <>
                      <input type="time" value={dayHours.open} onChange={(e) => set('hours', { ...form.hours!, [day]: { ...dayHours, open: e.target.value } })} className="text-sm border border-gray-200 rounded px-2 py-1 focus:outline-none focus:border-primary" />
                      <span className="text-gray-400 text-xs">to</span>
                      <input type="time" value={dayHours.close} onChange={(e) => set('hours', { ...form.hours!, [day]: { ...dayHours, close: e.target.value } })} className="text-sm border border-gray-200 rounded px-2 py-1 focus:outline-none focus:border-primary" />
                    </>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {activeTab === 'social' && (
          <div className="space-y-5">
            <Field label="Instagram URL" value={form.socialMedia?.instagram || ''} onChange={v => set('socialMedia', { ...form.socialMedia!, instagram: v })} placeholder="https://instagram.com/yourpage" type="url" />
            <Field label="Facebook URL" value={form.socialMedia?.facebook || ''} onChange={v => set('socialMedia', { ...form.socialMedia!, facebook: v })} placeholder="https://facebook.com/yourpage" type="url" />
            <Field label="Twitter / X URL" value={form.socialMedia?.twitter || ''} onChange={v => set('socialMedia', { ...form.socialMedia!, twitter: v })} placeholder="https://twitter.com/yourpage" type="url" />
            <Field label="Yelp URL" value={form.socialMedia?.yelp || ''} onChange={v => set('socialMedia', { ...form.socialMedia!, yelp: v })} placeholder="https://yelp.com/biz/yourpage" type="url" />
            <div className="border-t border-gray-100 pt-5 space-y-4">
              <h3 className="font-semibold text-sm text-charcoal">SEO</h3>
              <Field label="SEO Title" value={form.seoTitle || ''} onChange={v => set('seoTitle', v)} placeholder="Restaurant Name — City" />
              <Field label="SEO Description" value={form.seoDescription || ''} onChange={v => set('seoDescription', v)} multiline placeholder="Brief description for search engines (150–160 chars)" />
            </div>
          </div>
        )}

        {activeTab === 'announcement' && (
          <div className="space-y-5">
            <p className="text-sm text-gray-500">Show a banner at the top of the website (e.g. holiday hours, special events).</p>
            <Field label="Announcement Text" value={form.announcement || ''} onChange={v => set('announcement', v)} placeholder="e.g. We are closed on Thanksgiving. Happy holidays!" multiline />
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={form.announcementActive ?? false} onChange={e => set('announcementActive', e.target.checked)} className="w-4 h-4 accent-primary" />
              <div>
                <p className="text-sm font-medium text-charcoal">Show announcement banner</p>
                <p className="text-xs text-gray-500">Toggle to show/hide the banner on the website</p>
              </div>
            </label>
          </div>
        )}
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSave} loading={saving} size="lg">
          <Save className="w-4 h-4" /> Save All Changes
        </Button>
      </div>
    </div>
  )
}

function Field({
  label, value, onChange, type = 'text', placeholder, multiline, hint
}: {
  label: string; value: string; onChange: (v: string) => void;
  type?: string; placeholder?: string; multiline?: boolean; hint?: string
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      {multiline ? (
        <textarea value={value} onChange={e => onChange(e.target.value)} className="input-base resize-none" rows={3} placeholder={placeholder} />
      ) : (
        <input type={type} value={value} onChange={e => onChange(e.target.value)} className="input-base" placeholder={placeholder} />
      )}
      {hint && <p className="text-xs text-gray-400">{hint}</p>}
    </div>
  )
}
