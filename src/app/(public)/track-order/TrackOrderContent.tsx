'use client'

import { useState, useEffect, useCallback } from 'react'
import { Search, Bell, CheckCircle2, Clock, ChefHat, XCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import { formatPrice } from '@/lib/utils'
import { requestPushToken, canUsePush, listenForForegroundMessages } from '@/lib/pushNotifications'
import type { Order, OrderStatus } from '@/types'

const STATUS_STEPS: Array<{ key: OrderStatus; label: string; icon: typeof Clock }> = [
  { key: 'PENDING', label: 'Order Placed', icon: Clock },
  { key: 'IN_PROGRESS', label: 'Preparing', icon: ChefHat },
  { key: 'COMPLETED', label: 'Ready', icon: CheckCircle2 },
]

function StatusTimeline({ status }: { status: OrderStatus }) {
  if (status === 'CANCELLED') {
    return (
      <div className="flex items-center gap-2 text-red-400">
        <XCircle className="w-5 h-5" />
        <span className="font-medium text-sm">Order Cancelled</span>
      </div>
    )
  }

  const currentIndex = STATUS_STEPS.findIndex((s) => s.key === status)

  return (
    <div className="flex items-center">
      {STATUS_STEPS.map((step, i) => {
        const reached = i <= currentIndex
        const Icon = step.icon
        return (
          <div key={step.key} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center border-2 transition-colors ${
                  reached ? 'bg-gold border-gold text-charcoal' : 'border-cream/20 text-cream/30'
                }`}
              >
                <Icon className="w-4 h-4" />
              </div>
              <span className={`text-xs ${reached ? 'text-cream' : 'text-cream/30'}`}>{step.label}</span>
            </div>
            {i < STATUS_STEPS.length - 1 && (
              <div className={`h-0.5 flex-1 mx-1 mb-5 ${i < currentIndex ? 'bg-gold' : 'bg-cream/10'}`} />
            )}
          </div>
        )
      })}
    </div>
  )
}

function OrderCard({ order }: { order: Order }) {
  const [enabling, setEnabling] = useState(false)
  const [enabled, setEnabled] = useState(!!order.notificationToken)

  async function enableNotifications() {
    setEnabling(true)
    try {
      const pushToken = await requestPushToken()
      if (!pushToken) {
        setEnabling(false)
        return
      }
      await fetch(`/api/orders/${order.id}/token`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationToken: pushToken }),
      })
      setEnabled(true)
    } finally {
      setEnabling(false)
    }
  }

  return (
    <div className="bg-white/5 border border-cream/10 rounded-sm p-6">
      <div className="flex items-start justify-between gap-4 flex-wrap mb-6">
        <div>
          <p className="text-xs text-cream/40 uppercase tracking-wide">
            {order.orderType === 'DINE_IN' ? 'Dine-in' : 'Takeout'} Order
          </p>
          <p className="text-cream/60 text-sm mt-1">
            {order.items.map((i) => `${i.quantity}× ${i.name}`).join(', ')}
          </p>
        </div>
        <span className="text-gold font-bold">{formatPrice(order.total)}</span>
      </div>

      <StatusTimeline status={order.status} />

      {order.status !== 'CANCELLED' && order.status !== 'COMPLETED' && canUsePush() && (
        <div className="mt-6 pt-5 border-t border-cream/10">
          {enabled ? (
            <p className="flex items-center gap-2 text-xs text-emerald-400">
              <Bell className="w-3.5 h-3.5" /> You'll be notified when your order status changes
            </p>
          ) : (
            <button
              type="button"
              onClick={enableNotifications}
              disabled={enabling}
              className="flex items-center gap-2 text-xs text-gold hover:underline disabled:opacity-50"
            >
              <Bell className="w-3.5 h-3.5" />
              {enabling ? 'Enabling…' : 'Notify me when my order is ready'}
            </button>
          )}
        </div>
      )}
    </div>
  )
}

export function TrackOrderContent() {
  const [phone, setPhone] = useState('')
  const [searchedPhone, setSearchedPhone] = useState('')
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [searched, setSearched] = useState(false)

  // Same gap as the admin panel: FCM only auto-shows a notification when
  // this tab is backgrounded. If someone's watching this page when their
  // order updates, show it ourselves instead of relying on a silent push.
  useEffect(() => {
    if (!canUsePush()) return
    if (typeof window === 'undefined' || Notification.permission !== 'granted') return

    let unsubscribe: (() => void) | undefined
    listenForForegroundMessages((payload) => {
      const title = payload.notification?.title || 'Order Update'
      const body = payload.notification?.body || ''
      toast.success(`${title}${body ? ` — ${body}` : ''}`, { duration: 6000, icon: '🔔' })
      if (searchedPhone) fetchOrders(searchedPhone)
    }).then((unsub) => { unsubscribe = unsub })

    return () => unsubscribe?.()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchedPhone])

  const fetchOrders = useCallback(async (phoneNumber: string) => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/orders/track?phone=${encodeURIComponent(phoneNumber)}`)
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to look up orders')
      }
      const data = await res.json()
      setOrders(data)
    } catch (err) {
      setError((err as Error).message)
      setOrders([])
    } finally {
      setLoading(false)
    }
  }, [])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!phone.trim()) return
    setSearchedPhone(phone.trim())
    setSearched(true)
    fetchOrders(phone.trim())
  }

  // Poll while viewing results so status updates show up without a manual refresh.
  useEffect(() => {
    if (!searchedPhone) return
    const interval = setInterval(() => fetchOrders(searchedPhone), 15000)
    return () => clearInterval(interval)
  }, [searchedPhone, fetchOrders])

  return (
    <div className="pt-32 pb-24">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 text-center mb-12">
        <p className="section-label">Order Status</p>
        <div className="gold-divider" />
        <h1 className="section-heading mt-4 text-cream">
          Track Your <span className="italic text-primary-light">Order</span>
        </h1>
        <p className="text-cream/60 mt-4">
          Enter the phone number you used when ordering to check your order status.
        </p>
      </div>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <form onSubmit={handleSubmit} className="flex gap-3 mb-10">
          <input
            type="tel"
            required
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Your phone number"
            className="flex-1 bg-white/5 border border-cream/20 rounded-sm px-4 py-3 text-sm text-cream placeholder-cream/30 focus:outline-none focus:border-gold transition-colors"
          />
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 px-6 py-3 bg-gold text-charcoal font-semibold text-sm rounded-sm hover:bg-gold-dark transition-colors disabled:opacity-60"
          >
            <Search className="w-4 h-4" /> {loading ? 'Checking…' : 'Check Status'}
          </button>
        </form>

        {error && <p className="text-red-400 text-sm text-center mb-6">{error}</p>}

        {searched && !loading && !error && orders.length === 0 && (
          <p className="text-center text-cream/40 text-sm">
            No recent orders found for that phone number.
          </p>
        )}

        <div className="space-y-5">
          {orders.map((order) => (
            <OrderCard key={order.id} order={order} />
          ))}
        </div>
      </div>
    </div>
  )
}
