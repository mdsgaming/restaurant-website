'use client'

import React, { useEffect, useState } from 'react'
import { Check, X, Eye, Flame, Leaf, ShieldCheck, Star } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import {
  getPendingChanges,
  reviewPendingChange,
  addAuditLog,
  addGalleryItem,
  addMenuItem,
  updateMenuItem,
} from '@/lib/firestore'
import { formatDateTime, formatPrice } from '@/lib/utils'
import { StatusBadge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import type { PendingChange } from '@/types'
import toast from 'react-hot-toast'
import { SectionLoader } from '@/components/ui/LoadingSpinner'

type FilterType = 'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex gap-3">
      <span className="text-xs font-medium text-gray-500 w-24 shrink-0 pt-0.5">{label}</span>
      <span className="text-sm text-gray-800">{value}</span>
    </div>
  )
}

function ChangeDataPreview({ change }: { change: PendingChange }) {
  const d = change.data as Record<string, unknown>

  const isSpicy = !!d.isSpicy
  const isVeg = !!d.isVegetarian
  const isGF = !!d.isGlutenFree
  const isFeatured = !!d.isFeatured

  if (change.type === 'MENU_ITEM_ADD' || change.type === 'MENU_ITEM_EDIT') {
    return (
      <div className="space-y-3">
        {typeof d.imageUrl === 'string' && d.imageUrl && (
          <img src={d.imageUrl} alt={String(d.name ?? '')} className="w-full h-40 object-cover rounded-sm border border-gray-200" />
        )}
        <Field label="Name" value={<span className="font-semibold">{String(d.name ?? '—')}</span>} />
        {d.price !== undefined && (
          <Field label="Price" value={formatPrice(Number(d.price))} />
        )}
        {!!d.description && (
          <Field label="Description" value={String(d.description)} />
        )}
        <Field
          label="Tags"
          value={
            <div className="flex flex-wrap gap-1.5">
              {isSpicy && <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-50 text-red-600 text-xs rounded-full"><Flame className="w-3 h-3" />Spicy</span>}
              {isVeg && <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-600 text-xs rounded-full"><Leaf className="w-3 h-3" />Vegetarian</span>}
              {isGF && <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-600 text-xs rounded-full"><ShieldCheck className="w-3 h-3" />Gluten-Free</span>}
              {isFeatured && <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-yellow-50 text-yellow-600 text-xs rounded-full"><Star className="w-3 h-3" />Featured</span>}
              {!isSpicy && !isVeg && !isGF && !isFeatured && <span className="text-gray-400 text-xs">None</span>}
            </div>
          }
        />
        <Field label="Available" value={d.isAvailable ? 'Yes' : 'No'} />
      </div>
    )
  }

  if (change.type === 'GALLERY_ADD' || change.type === 'GALLERY_EDIT') {
    return (
      <div className="space-y-3">
        {d.type === 'IMAGE' && typeof d.url === 'string' && d.url && (
          <img src={d.url} alt={String(d.caption ?? '')} className="w-full h-48 object-cover rounded-sm border border-gray-200" />
        )}
        <Field label="Type" value={String(d.type ?? '—')} />
        {!!d.caption && <Field label="Caption" value={String(d.caption)} />}
      </div>
    )
  }

  // Fallback: render key/value pairs for any other type
  return (
    <div className="space-y-2">
      {Object.entries(d)
        .filter(([k]) => k !== 'id' && k !== 'sortOrder')
        .map(([key, val]) => (
          <Field
            key={key}
            label={key}
            value={typeof val === 'boolean' ? (val ? 'Yes' : 'No') : String(val ?? '—')}
          />
        ))}
    </div>
  )
}

export default function ApprovalsPage() {
  const { appUser, canApprove } = useAuth()
  const [changes, setChanges] = useState<PendingChange[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<FilterType>('PENDING')
  const [reviewNote, setReviewNote] = useState('')
  const [reviewModal, setReviewModal] = useState<{ change: PendingChange; action: 'APPROVED' | 'REJECTED' } | null>(null)
  const [detailModal, setDetailModal] = useState<PendingChange | null>(null)
  const [processing, setProcessing] = useState(false)

  async function load() {
    try {
      const all = await getPendingChanges(filter === 'ALL' ? undefined : filter)
      setChanges(all)
    } catch { /* ignore */ }
    finally { setLoading(false) }
  }

  useEffect(() => { setLoading(true); load() }, [filter])

  async function handleReview() {
    if (!reviewModal || !canApprove) return
    setProcessing(true)
    const { change, action } = reviewModal
    try {
      await reviewPendingChange(change.id, action, appUser!.uid, appUser!.name, reviewNote)

      if (action === 'APPROVED') {
        await applyChange(change)
      }

      await addAuditLog({
        userId: appUser!.uid,
        userName: appUser!.name,
        userRole: appUser!.role,
        action: `${action.toLowerCase()} pending change`,
        resource: 'pendingChange',
        details: { changeType: change.type, submittedBy: change.submittedByName, note: reviewNote },
      })

      toast.success(action === 'APPROVED' ? 'Change approved and applied!' : 'Change rejected.')
      setReviewModal(null)
      setReviewNote('')
      load()
    } catch (e) {
      toast.error('Failed to process review')
    } finally {
      setProcessing(false)
    }
  }

  async function applyChange(change: PendingChange) {
    const data = change.data as Record<string, unknown>
    switch (change.type) {
      case 'GALLERY_ADD':
        await addGalleryItem(data as Parameters<typeof addGalleryItem>[0])
        break
      case 'MENU_ITEM_ADD':
        await addMenuItem(data as Parameters<typeof addMenuItem>[0])
        break
      case 'MENU_ITEM_EDIT':
        if (data.id && typeof data.id === 'string') {
          const { id, ...rest } = data
          await updateMenuItem(id, rest as Parameters<typeof updateMenuItem>[1])
        }
        break
    }
  }

  const counts = {
    ALL: changes.length,
    PENDING: changes.filter(c => c.status === 'PENDING').length,
    APPROVED: changes.filter(c => c.status === 'APPROVED').length,
    REJECTED: changes.filter(c => c.status === 'REJECTED').length,
  }

  const CHANGE_TYPE_LABELS: Record<string, string> = {
    GALLERY_ADD: 'Add to Gallery',
    GALLERY_REMOVE: 'Remove from Gallery',
    GALLERY_EDIT: 'Edit Gallery Item',
    TEXT_CHANGE: 'Text Change',
    MENU_ITEM_ADD: 'Add Menu Item',
    MENU_ITEM_EDIT: 'Edit Menu Item',
    MENU_ITEM_REMOVE: 'Remove Menu Item',
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="font-serif text-2xl text-charcoal">Approval Queue</h1>
        <p className="text-sm text-charcoal/50 mt-0.5">
          Review and approve or reject changes submitted by Assistants.
        </p>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 border-b border-gray-200">
        {(['PENDING', 'ALL', 'APPROVED', 'REJECTED'] as FilterType[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
              filter === f ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {f === 'ALL' ? 'All' : f.charAt(0) + f.slice(1).toLowerCase()}
            {f === 'PENDING' && counts.PENDING > 0 && (
              <span className="bg-gold text-charcoal text-xs font-bold px-1.5 py-0.5 rounded-full">{counts.PENDING}</span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <SectionLoader />
      ) : changes.length === 0 ? (
        <div className="admin-card text-center py-16">
          <Check className="w-10 h-10 text-gray-200 mx-auto mb-3" />
          <p className="font-serif text-xl text-gray-400 italic">
            {filter === 'PENDING' ? 'No pending changes' : 'No changes found'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {changes.map((change) => (
            <div key={change.id} className="admin-card">
              <div className="flex items-start gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1 flex-wrap">
                    <span className="font-medium text-charcoal text-sm">
                      {CHANGE_TYPE_LABELS[change.type] || change.type}
                    </span>
                    <StatusBadge status={change.status} />
                  </div>
                  <p className="text-sm text-charcoal/60 mb-2">{change.description}</p>
                  <div className="text-xs text-gray-400 space-y-0.5">
                    <p>Submitted by <span className="font-medium text-gray-600">{change.submittedByName}</span> · {formatDateTime(change.createdAt)}</p>
                    {change.reviewedByName && (
                      <p>Reviewed by <span className="font-medium text-gray-600">{change.reviewedByName}</span>
                        {change.reviewNote && <> · &ldquo;{change.reviewNote}&rdquo;</>}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => setDetailModal(change)}
                    className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                    title="View details"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  {canApprove && change.status === 'PENDING' && (
                    <>
                      <button
                        onClick={() => { setReviewNote(''); setReviewModal({ change, action: 'REJECTED' }) }}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                        title="Reject"
                      >
                        <X className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => { setReviewNote(''); setReviewModal({ change, action: 'APPROVED' }) }}
                        className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded transition-colors"
                        title="Approve"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Review Modal */}
      <Modal
        isOpen={!!reviewModal}
        onClose={() => setReviewModal(null)}
        title={reviewModal?.action === 'APPROVED' ? 'Approve Change' : 'Reject Change'}
        size="sm"
      >
        <div className="p-6 space-y-4">
          <p className="text-sm text-gray-600">
            {reviewModal?.action === 'APPROVED'
              ? 'This change will be applied to the live website immediately.'
              : 'This change will be rejected and the assistant will be notified.'}
          </p>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">Note (optional)</label>
            <textarea
              value={reviewNote}
              onChange={(e) => setReviewNote(e.target.value)}
              className="input-base resize-none"
              rows={2}
              placeholder="Add a note for the assistant..."
            />
          </div>
          <div className="flex gap-3 justify-end">
            <button onClick={() => setReviewModal(null)} className="px-4 py-2 text-sm border border-gray-200 rounded-sm hover:bg-gray-50">
              Cancel
            </button>
            <button
              onClick={handleReview}
              disabled={processing}
              className={`px-4 py-2 text-sm font-medium text-white rounded-sm transition-colors disabled:opacity-50 ${
                reviewModal?.action === 'APPROVED' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700'
              }`}
            >
              {processing ? 'Processing…' : reviewModal?.action === 'APPROVED' ? 'Approve & Apply' : 'Reject'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Detail Modal */}
      <Modal isOpen={!!detailModal} onClose={() => setDetailModal(null)} title="Change Details" size="md">
        <div className="p-6 space-y-4">
          {detailModal && <ChangeDataPreview change={detailModal} />}
        </div>
      </Modal>
    </div>
  )
}
