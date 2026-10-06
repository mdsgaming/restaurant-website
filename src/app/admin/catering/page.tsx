'use client'

import { useCallback, useEffect, useState } from 'react'
import { ChefHat, Mail, Phone, RefreshCw, CalendarDays, Users, MapPin } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '@/contexts/AuthContext'
import { staffAuthHeaders } from '@/lib/authHeaders'
import { formatDateTime } from '@/lib/utils'
import {
  BUDGETS,
  CATERING_STATUSES,
  CONTACT_METHODS,
  CONTACT_TIMES,
  EVENT_TYPES,
  SERVICE_STYLES,
  type CateringRequest,
  type CateringStatus,
} from '@/lib/catering'

const STATUS_COLORS: Record<CateringStatus, string> = {
  NEW: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  CONTACTED: 'bg-blue-100 text-blue-700 border-blue-200',
  BOOKED: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  DECLINED: 'bg-gray-100 text-gray-600 border-gray-200',
}

type Filter = CateringStatus | 'ALL'

function formatEventDate(date: string, time: string): string {
  const d = new Date(`${date}T${time || '12:00'}:00`)
  if (Number.isNaN(d.getTime())) return date
  const day = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
  if (!time) return day
  return `${day} at ${d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`
}

function daysUntil(date: string): string {
  const event = new Date(`${date}T00:00:00`)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const days = Math.round((event.getTime() - today.getTime()) / 86_400_000)
  if (Number.isNaN(days)) return ''
  if (days < 0) return 'Past'
  if (days === 0) return 'Today'
  if (days === 1) return 'Tomorrow'
  return `In ${days} days`
}

export default function AdminCateringPage() {
  const { role } = useAuth()
  const isAdmin = role === 'ADMIN' || role === 'DEVELOPER'
  const [requests, setRequests] = useState<CateringRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [filter, setFilter] = useState<Filter>('ALL')
  const [notes, setNotes] = useState<Record<string, string>>({})
  const [savingId, setSavingId] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/catering', { headers: await staffAuthHeaders() })
      if (!res.ok) throw new Error(res.status === 403 ? 'Only admins can view catering requests.' : 'Could not load catering requests.')
      const data: CateringRequest[] = await res.json()
      setRequests(data)
      setLoadError('')
    } catch (err) {
      setLoadError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!isAdmin) return
    load()
    const interval = setInterval(load, 60_000)
    return () => clearInterval(interval)
  }, [isAdmin, load])

  async function update(id: string, changes: { status?: CateringStatus; adminNotes?: string }) {
    setSavingId(id)
    try {
      const res = await fetch(`/api/catering/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...(await staffAuthHeaders()) },
        body: JSON.stringify(changes),
      })
      if (!res.ok) throw new Error()
      setRequests((prev) => prev.map((r) => (r.id === id ? { ...r, ...changes } : r)))
      toast.success(changes.status ? 'Status updated' : 'Notes saved')
    } catch {
      toast.error('Could not save. Please try again.')
    } finally {
      setSavingId(null)
    }
  }

  if (!isAdmin) {
    return (
      <div className="max-w-5xl">
        <h1 className="font-serif text-3xl text-charcoal">Catering Requests</h1>
        <p className="text-charcoal/55 mt-2 text-sm">Only admins can view catering requests.</p>
      </div>
    )
  }

  const newCount = requests.filter((r) => r.status === 'NEW').length
  const filtered = filter === 'ALL' ? requests : requests.filter((r) => r.status === filter)
  const filters: Array<{ value: Filter; label: string }> = [
    { value: 'ALL', label: 'All' },
    ...Object.entries(CATERING_STATUSES).map(([value, label]) => ({ value: value as CateringStatus, label })),
  ]

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl text-charcoal">Catering Requests</h1>
          <p className="text-charcoal/55 mt-1 text-sm">
            People looking to book us for an event. Refreshes every minute.
            {newCount > 0 && (
              <span className="ml-2 inline-flex items-center bg-yellow-100 text-yellow-700 text-xs font-semibold px-2 py-0.5 rounded-full border border-yellow-200">
                {newCount} new
              </span>
            )}
          </p>
        </div>
        <button
          type="button"
          onClick={() => { setLoading(true); load() }}
          className="flex items-center gap-2 px-4 py-2 text-sm border border-charcoal/20 rounded-sm hover:bg-charcoal/5 transition-colors text-charcoal/70"
        >
          <RefreshCw className="w-4 h-4" aria-hidden="true" /> Refresh
        </button>
      </div>

      <div className="flex gap-2 flex-wrap">
        {filters.map((f) => (
          <button
            key={f.value}
            type="button"
            onClick={() => setFilter(f.value)}
            className={`px-4 py-2 text-sm rounded-full border transition-colors ${
              filter === f.value
                ? 'bg-charcoal text-cream border-charcoal'
                : 'border-charcoal/20 text-charcoal/60 hover:border-charcoal/40 hover:text-charcoal'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loadError && (
        <div role="alert" className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-sm px-4 py-3">{loadError}</div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-charcoal/20 border-t-charcoal rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <ChefHat className="w-12 h-12 text-charcoal/20 mb-4" aria-hidden="true" />
          <p className="text-charcoal/40 font-serif text-lg italic">No catering requests yet</p>
          <p className="text-charcoal/30 text-sm mt-1">Requests from the Catering page will appear here.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((r) => {
            const noteValue = notes[r.id] ?? r.adminNotes ?? ''
            return (
              <article key={r.id} className="bg-white rounded-sm border border-charcoal/10 p-4 sm:p-5 shadow-sm space-y-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="font-semibold text-charcoal">{r.name}</h2>
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${STATUS_COLORS[r.status] ?? STATUS_COLORS.NEW}`}>
                        {CATERING_STATUSES[r.status] ?? r.status}
                      </span>
                    </div>
                    <p className="text-xs text-charcoal/40 mt-1">Received {formatDateTime(r.createdAt)}</p>
                  </div>
                  <label className="text-xs text-charcoal/60 flex items-center gap-2">
                    Status
                    <select
                      value={r.status}
                      disabled={savingId === r.id}
                      onChange={(e) => update(r.id, { status: e.target.value as CateringStatus })}
                      className="text-sm border border-charcoal/20 rounded-sm px-2 py-1.5 bg-white text-charcoal"
                    >
                      {Object.entries(CATERING_STATUSES).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                    </select>
                  </label>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                  <div className="flex items-start gap-2 bg-charcoal/[0.03] rounded-sm p-3">
                    <CalendarDays className="w-4 h-4 text-primary mt-0.5 shrink-0" aria-hidden="true" />
                    <div>
                      <p className="font-medium text-charcoal">{formatEventDate(r.eventDate, r.eventTime)}</p>
                      <p className="text-xs text-charcoal/50">{daysUntil(r.eventDate)}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2 bg-charcoal/[0.03] rounded-sm p-3">
                    <Users className="w-4 h-4 text-primary mt-0.5 shrink-0" aria-hidden="true" />
                    <div>
                      <p className="font-medium text-charcoal">{r.guestCount} guests</p>
                      <p className="text-xs text-charcoal/50">{EVENT_TYPES[r.eventType] ?? r.eventType}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2 bg-charcoal/[0.03] rounded-sm p-3">
                    <ChefHat className="w-4 h-4 text-primary mt-0.5 shrink-0" aria-hidden="true" />
                    <div>
                      <p className="font-medium text-charcoal">{SERVICE_STYLES[r.serviceStyle] ?? r.serviceStyle}</p>
                      <p className="text-xs text-charcoal/50">Budget: {BUDGETS[r.budget] ?? r.budget}</p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
                  <a href={`tel:${r.phone}`} className="inline-flex items-center gap-1.5 text-charcoal/70 hover:text-charcoal">
                    <Phone className="w-3.5 h-3.5" aria-hidden="true" /> {r.phone}
                  </a>
                  <a href={`mailto:${r.email}`} className="inline-flex items-center gap-1.5 text-charcoal/70 hover:text-charcoal break-all">
                    <Mail className="w-3.5 h-3.5 shrink-0" aria-hidden="true" /> {r.email}
                  </a>
                  {r.eventLocation && (
                    <span className="inline-flex items-center gap-1.5 text-charcoal/70">
                      <MapPin className="w-3.5 h-3.5 shrink-0" aria-hidden="true" /> {r.eventLocation}
                    </span>
                  )}
                </div>

                <p className="text-sm text-charcoal/70 bg-yellow-50 border border-yellow-100 rounded-sm px-3 py-2">
                  Prefers <strong>{CONTACT_METHODS[r.contactMethod] ?? r.contactMethod}</strong>, best time:{' '}
                  <strong>{CONTACT_TIMES[r.contactTime] ?? r.contactTime}</strong>
                </p>

                {(r.menuInterests || r.dietaryNeeds || r.additionalDetails) && (
                  <dl className="space-y-2 text-sm border-t border-charcoal/10 pt-3">
                    {r.menuInterests && (
                      <div><dt className="text-xs font-medium text-charcoal/45">Dishes interested in</dt><dd className="text-charcoal/80 break-words">{r.menuInterests}</dd></div>
                    )}
                    {r.dietaryNeeds && (
                      <div><dt className="text-xs font-medium text-charcoal/45">Allergies / dietary needs</dt><dd className="text-charcoal/80 break-words">{r.dietaryNeeds}</dd></div>
                    )}
                    {r.additionalDetails && (
                      <div><dt className="text-xs font-medium text-charcoal/45">Other details</dt><dd className="text-charcoal/80 whitespace-pre-line break-words">{r.additionalDetails}</dd></div>
                    )}
                  </dl>
                )}

                <div className="border-t border-charcoal/10 pt-3">
                  <label htmlFor={`notes-${r.id}`} className="block text-xs font-medium text-charcoal/45 mb-1.5">Staff notes (private)</label>
                  <textarea
                    id={`notes-${r.id}`}
                    rows={2}
                    value={noteValue}
                    onChange={(e) => setNotes((n) => ({ ...n, [r.id]: e.target.value }))}
                    placeholder="e.g. Called Tuesday, sending quote by Friday…"
                    className="w-full text-base sm:text-sm border border-charcoal/20 rounded-sm px-3 py-2 text-charcoal focus:outline-none focus:border-charcoal/50 resize-none"
                  />
                  {noteValue !== (r.adminNotes ?? '') && (
                    <button
                      type="button"
                      disabled={savingId === r.id}
                      onClick={() => update(r.id, { adminNotes: noteValue })}
                      className="mt-2 px-4 py-2 bg-charcoal text-cream text-sm rounded-sm hover:bg-charcoal/80 disabled:opacity-50"
                    >
                      {savingId === r.id ? 'Saving…' : 'Save Notes'}
                    </button>
                  )}
                </div>
              </article>
            )
          })}
        </div>
      )}
    </div>
  )
}
