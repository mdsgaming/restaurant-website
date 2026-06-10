'use client'

import { useState } from 'react'
import { X, CheckCircle } from 'lucide-react'
import { useCart } from '@/contexts/CartContext'
import { formatPrice } from '@/lib/utils'
import type { OrderType } from '@/types'

interface Props {
  onClose: () => void
}

export function CheckoutModal({ onClose }: Props) {
  const { items, total, clearCart } = useCart()
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [orderType, setOrderType] = useState<OrderType>('TAKEOUT')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: name,
          customerPhone: phone,
          orderType,
          notes,
          total,
          items: items.map(i => ({
            itemId: i.id,
            name: i.name,
            price: i.price,
            quantity: i.quantity,
          })),
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to place order')
      }

      setSuccess(true)
      clearCart()
      setTimeout(onClose, 3000)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-charcoal border border-cream/10 rounded-sm shadow-2xl">
        {success ? (
          <div className="p-10 text-center">
            <CheckCircle className="w-14 h-14 text-emerald-400 mx-auto mb-4" />
            <h2 className="font-serif text-2xl text-cream mb-2">Order Placed!</h2>
            <p className="text-cream/60 text-sm">We've received your order and will start preparing it shortly.</p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between p-5 border-b border-cream/10">
              <h2 className="font-serif text-xl text-cream">Complete Your Order</h2>
              <button type="button" onClick={onClose} className="text-cream/40 hover:text-cream transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-cream/60 mb-1.5">Your Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. John Smith"
                  className="w-full bg-white/5 border border-cream/20 rounded-sm px-3 py-2.5 text-sm text-cream placeholder-cream/30 focus:outline-none focus:border-gold transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-cream/60 mb-1.5">Phone Number</label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="e.g. 07700 900000"
                  className="w-full bg-white/5 border border-cream/20 rounded-sm px-3 py-2.5 text-sm text-cream placeholder-cream/30 focus:outline-none focus:border-gold transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-cream/60 mb-2">Order Type</label>
                <div className="grid grid-cols-2 gap-3">
                  {(['TAKEOUT', 'DINE_IN'] as OrderType[]).map(type => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setOrderType(type)}
                      className={`py-2.5 text-sm font-medium rounded-sm border transition-colors ${
                        orderType === type
                          ? 'bg-gold text-charcoal border-gold'
                          : 'border-cream/20 text-cream/60 hover:border-cream/40 hover:text-cream'
                      }`}
                    >
                      {type === 'TAKEOUT' ? 'Takeout' : 'Dine-in'}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-cream/60 mb-1.5">Notes <span className="text-cream/30">(optional)</span></label>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Any allergies or special requests?"
                  rows={2}
                  className="w-full bg-white/5 border border-cream/20 rounded-sm px-3 py-2.5 text-sm text-cream placeholder-cream/30 focus:outline-none focus:border-gold transition-colors resize-none"
                />
              </div>

              <div className="pt-1 border-t border-cream/10">
                <div className="flex items-center justify-between text-sm mb-4">
                  <span className="text-cream/60">Total ({items.reduce((s, i) => s + i.quantity, 0)} items)</span>
                  <span className="text-gold font-bold text-base">{formatPrice(total)}</span>
                </div>

                {error && <p className="text-red-400 text-xs mb-3">{error}</p>}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-gold text-charcoal font-bold text-sm rounded-sm hover:bg-gold/90 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loading ? 'Placing Order…' : 'Confirm Order'}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
