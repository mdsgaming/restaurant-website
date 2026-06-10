'use client'

import { useState, useEffect, useCallback } from 'react'
import { ShoppingBag, RefreshCw, Phone } from 'lucide-react'
import toast from 'react-hot-toast'
import { formatPrice } from '@/lib/utils'
import type { OrderStatus, OrderType } from '@/types'

interface OrderItem {
  itemId: string
  name: string
  price: number
  quantity: number
}

interface Order {
  id: string
  customerName: string
  customerPhone: string
  orderType: OrderType
  items: OrderItem[]
  notes?: string
  status: OrderStatus
  total: number
  createdAt: string
}

const STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING: 'Pending',
  IN_PROGRESS: 'Preparing',
  COMPLETED: 'Ready',
  CANCELLED: 'Cancelled',
}

const STATUS_COLORS: Record<OrderStatus, string> = {
  PENDING: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  IN_PROGRESS: 'bg-blue-100 text-blue-700 border-blue-200',
  COMPLETED: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  CANCELLED: 'bg-red-100 text-red-700 border-red-200',
}

const FILTERS: Array<{ label: string; value: OrderStatus | 'ALL' }> = [
  { label: 'All', value: 'ALL' },
  { label: 'Pending', value: 'PENDING' },
  { label: 'Preparing', value: 'IN_PROGRESS' },
  { label: 'Ready', value: 'COMPLETED' },
  { label: 'Cancelled', value: 'CANCELLED' },
]

function timeAgo(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
  if (seconds < 60) return `${seconds}s ago`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  return `${hours}h ago`
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<OrderStatus | 'ALL'>('ALL')
  const [updating, setUpdating] = useState<string | null>(null)

  const fetchOrders = useCallback(async () => {
    try {
      const res = await fetch('/api/orders')
      if (!res.ok) throw new Error()
      const data = await res.json()
      setOrders(data)
    } catch {
      // silent on background refresh
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchOrders()
    const interval = setInterval(fetchOrders, 30000)
    return () => clearInterval(interval)
  }, [fetchOrders])

  async function updateStatus(id: string, status: OrderStatus) {
    setUpdating(id)
    try {
      const res = await fetch(`/api/orders/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (!res.ok) throw new Error()
      setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o))
      toast.success('Order updated')
    } catch {
      toast.error('Failed to update order')
    } finally {
      setUpdating(null)
    }
  }

  const filtered = filter === 'ALL' ? orders : orders.filter(o => o.status === filter)
  const pendingCount = orders.filter(o => o.status === 'PENDING').length

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl text-charcoal">Orders</h1>
          <p className="text-charcoal/55 mt-1 text-sm">
            Live customer orders — auto-refreshes every 30 seconds
            {pendingCount > 0 && (
              <span className="ml-2 inline-flex items-center gap-1 bg-yellow-100 text-yellow-700 text-xs font-semibold px-2 py-0.5 rounded-full border border-yellow-200">
                {pendingCount} new
              </span>
            )}
          </p>
        </div>
        <button
          type="button"
          onClick={() => { setLoading(true); fetchOrders() }}
          className="flex items-center gap-2 px-4 py-2 text-sm border border-charcoal/20 rounded-sm hover:bg-charcoal/5 transition-colors text-charcoal/70"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {FILTERS.map(f => (
          <button
            key={f.value}
            type="button"
            onClick={() => setFilter(f.value)}
            className={`px-4 py-1.5 text-sm rounded-full border transition-colors ${
              filter === f.value
                ? 'bg-charcoal text-cream border-charcoal'
                : 'border-charcoal/20 text-charcoal/60 hover:border-charcoal/40 hover:text-charcoal'
            }`}
          >
            {f.label}
            {f.value === 'PENDING' && pendingCount > 0 && (
              <span className="ml-1.5 bg-yellow-400 text-charcoal text-xs font-bold px-1.5 rounded-full">
                {pendingCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Orders list */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-charcoal/20 border-t-charcoal rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <ShoppingBag className="w-12 h-12 text-charcoal/20 mb-4" />
          <p className="text-charcoal/40 font-serif text-lg italic">No orders yet</p>
          <p className="text-charcoal/30 text-sm mt-1">Customer orders will appear here</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map(order => (
            <div key={order.id} className="bg-white rounded-sm border border-charcoal/10 p-5 shadow-sm">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                {/* Customer info */}
                <div>
                  <div className="flex items-center gap-3 flex-wrap">
                    <h3 className="font-semibold text-charcoal">{order.customerName}</h3>
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${STATUS_COLORS[order.status]}`}>
                      {STATUS_LABELS[order.status]}
                    </span>
                    <span className="text-xs bg-charcoal/8 text-charcoal/60 px-2.5 py-1 rounded-full border border-charcoal/10">
                      {order.orderType === 'DINE_IN' ? 'Dine-in' : 'Takeout'}
                    </span>
                  </div>
                  <a
                    href={`tel:${order.customerPhone}`}
                    className="inline-flex items-center gap-1.5 text-sm text-charcoal/50 hover:text-charcoal transition-colors mt-1"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    {order.customerPhone}
                  </a>
                </div>

                {/* Time + total */}
                <div className="text-right">
                  <p className="font-bold text-charcoal">{formatPrice(order.total)}</p>
                  <p className="text-xs text-charcoal/40 mt-0.5">{timeAgo(order.createdAt)}</p>
                </div>
              </div>

              {/* Items */}
              <div className="mt-4 space-y-1.5">
                {order.items.map((item, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <span className="text-charcoal/70">
                      <span className="font-medium text-charcoal">{item.quantity}×</span> {item.name}
                    </span>
                    <span className="text-charcoal/50">{formatPrice(item.price * item.quantity)}</span>
                  </div>
                ))}
              </div>

              {order.notes && (
                <p className="mt-3 text-sm text-charcoal/50 italic border-t border-charcoal/8 pt-3">
                  Note: {order.notes}
                </p>
              )}

              {/* Actions */}
              {(order.status === 'PENDING' || order.status === 'IN_PROGRESS') && (
                <div className="mt-4 flex items-center gap-3 pt-4 border-t border-charcoal/8">
                  {order.status === 'PENDING' && (
                    <button
                      type="button"
                      disabled={updating === order.id}
                      onClick={() => updateStatus(order.id, 'IN_PROGRESS')}
                      className="px-4 py-2 bg-charcoal text-cream text-sm font-medium rounded-sm hover:bg-charcoal/80 transition-colors disabled:opacity-50"
                    >
                      {updating === order.id ? 'Updating…' : 'Start Preparing'}
                    </button>
                  )}
                  {order.status === 'IN_PROGRESS' && (
                    <button
                      type="button"
                      disabled={updating === order.id}
                      onClick={() => updateStatus(order.id, 'COMPLETED')}
                      className="px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-sm hover:bg-emerald-700 transition-colors disabled:opacity-50"
                    >
                      {updating === order.id ? 'Updating…' : 'Mark Ready'}
                    </button>
                  )}
                  <button
                    type="button"
                    disabled={updating === order.id}
                    onClick={() => updateStatus(order.id, 'CANCELLED')}
                    className="px-4 py-2 border border-red-200 text-red-600 text-sm font-medium rounded-sm hover:bg-red-50 transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
