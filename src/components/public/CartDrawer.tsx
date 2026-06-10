'use client'

import { useState } from 'react'
import { X, Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react'
import { useCart } from '@/contexts/CartContext'
import { CheckoutModal } from './CheckoutModal'
import { formatPrice } from '@/lib/utils'

export function CartDrawer() {
  const { items, isOpen, closeCart, removeItem, updateQuantity, total, count } = useCart()
  const [checkoutOpen, setCheckoutOpen] = useState(false)

  if (!isOpen) return null

  return (
    <>
      <div className="fixed inset-0 z-50 flex justify-end">
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={closeCart} />
        <div className="relative w-full max-w-sm bg-charcoal border-l border-cream/10 flex flex-col shadow-2xl h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-cream/10">
            <div className="flex items-center gap-2.5">
              <ShoppingBag className="w-5 h-5 text-gold" />
              <h2 className="font-serif text-lg text-cream">Your Order</h2>
              {count > 0 && (
                <span className="bg-gold text-charcoal text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                  {count}
                </span>
              )}
            </div>
            <button type="button" onClick={closeCart} className="text-cream/40 hover:text-cream transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Items */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {items.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center py-16">
                <ShoppingBag className="w-12 h-12 text-cream/20 mb-4" />
                <p className="text-cream/40 font-serif text-lg italic">Your cart is empty</p>
                <p className="text-cream/25 text-sm mt-1">Add items from the menu</p>
              </div>
            ) : (
              items.map(item => (
                <div key={item.id} className="flex items-center gap-3 p-3 bg-white/5 rounded-sm border border-cream/10">
                  <div className="flex-1 min-w-0">
                    <p className="text-cream text-sm font-medium truncate">{item.name}</p>
                    <p className="text-gold text-sm font-semibold">{formatPrice(item.price)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="w-7 h-7 flex items-center justify-center border border-cream/20 rounded-sm text-cream/60 hover:text-cream hover:border-cream/40 transition-colors"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="text-cream text-sm font-medium w-4 text-center">{item.quantity}</span>
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="w-7 h-7 flex items-center justify-center border border-cream/20 rounded-sm text-cream/60 hover:text-cream hover:border-cream/40 transition-colors"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeItem(item.id)}
                      className="w-7 h-7 flex items-center justify-center text-cream/30 hover:text-red-400 transition-colors ml-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {items.length > 0 && (
            <div className="p-5 border-t border-cream/10 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-cream/60 text-sm">Subtotal</span>
                <span className="text-cream font-bold text-lg">{formatPrice(total)}</span>
              </div>
              <button
                type="button"
                onClick={() => { setCheckoutOpen(true) }}
                className="w-full py-3 bg-gold text-charcoal font-bold text-sm rounded-sm hover:bg-gold/90 transition-colors"
              >
                Place Order
              </button>
            </div>
          )}
        </div>
      </div>

      {checkoutOpen && (
        <CheckoutModal onClose={() => { setCheckoutOpen(false); closeCart() }} />
      )}
    </>
  )
}
