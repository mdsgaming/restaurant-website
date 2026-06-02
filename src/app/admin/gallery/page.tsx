'use client'

import { useEffect, useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Trash2, Eye, EyeOff, Upload, Image as ImageIcon, Video, X, Play } from 'lucide-react'
import {
  getGalleryItems,
  addGalleryItem,
  updateGalleryItem,
  deleteGalleryItem,
  addAuditLog,
  submitPendingChange,
} from '@/lib/firestore'
import { useAuth } from '@/contexts/AuthContext'
import { ConfirmModal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import type { GalleryItem } from '@/types'
import toast from 'react-hot-toast'
import { SectionLoader } from '@/components/ui/LoadingSpinner'

interface UploadItem {
  file: File
  preview: string
  progress: number
  caption: string
  type: 'IMAGE' | 'VIDEO'
}

export default function AdminGalleryPage() {
  const { appUser, isAssistant } = useAuth()
  const [items, setItems] = useState<GalleryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState<UploadItem[]>([])
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  async function load() {
    try {
      setItems(await getGalleryItems())
    } catch { /* ignore */ }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newUploads: UploadItem[] = acceptedFiles.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
      progress: 0,
      caption: '',
      type: file.type.startsWith('video/') ? 'VIDEO' : 'IMAGE',
    }))
    setUploading((prev) => [...prev, ...newUploads])
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpg', '.jpeg', '.png', '.webp', '.gif'], 'video/*': ['.mp4', '.mov', '.webm'] },
    maxSize: 50 * 1024 * 1024,
  })

  async function uploadAll() {
    if (uploading.length === 0) return

    for (let i = 0; i < uploading.length; i++) {
      const item = uploading[i]

      try {
        // 1. Request a presigned URL from our API
        const res = await fetch('/api/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            filename: item.file.name,
            contentType: item.file.type,
            contentLength: item.file.size,
            folder: 'gallery',
          }),
        })

        if (!res.ok) {
          const { error } = await res.json()
          throw new Error(error || 'Failed to get upload URL')
        }

        const { presignedUrl, publicUrl } = await res.json()
        setUploading((prev) => prev.map((u, idx) => idx === i ? { ...u, progress: 40 } : u))

        // 2. PUT file directly to R2
        const uploadRes = await fetch(presignedUrl, {
          method: 'PUT',
          headers: { 'Content-Type': item.file.type },
          body: item.file,
        })

        if (!uploadRes.ok) throw new Error('Upload to storage failed')
        setUploading((prev) => prev.map((u, idx) => idx === i ? { ...u, progress: 100 } : u))

        const galleryData = {
          type: item.type,
          url: publicUrl,
          caption: item.caption,
          sortOrder: items.length + i,
          isActive: true,
        }

        if (isAssistant) {
          await submitPendingChange({
            type: 'GALLERY_ADD',
            description: `Add gallery ${item.type.toLowerCase()}: ${item.caption || item.file.name}`,
            data: galleryData,
            submittedById: appUser!.uid,
            submittedByName: appUser!.name,
          })
        } else {
          await addGalleryItem(galleryData)
          await addAuditLog({
            userId: appUser!.uid,
            userName: appUser!.name,
            userRole: appUser!.role,
            action: 'uploaded gallery item',
            resource: 'gallery',
            details: { type: item.type },
          })
        }
      } catch (e) {
        toast.error(`Failed to upload "${item.file.name}": ${(e as Error).message}`)
      }
    }

    toast.success(isAssistant ? 'Submitted for approval' : `${uploading.length} item(s) uploaded!`)
    setUploading([])
    load()
  }

  async function toggleVisibility(item: GalleryItem) {
    try {
      await updateGalleryItem(item.id, { isActive: !item.isActive })
      await addAuditLog({ userId: appUser!.uid, userName: appUser!.name, userRole: appUser!.role, action: item.isActive ? 'hid gallery item' : 'showed gallery item', resource: 'gallery', details: { id: item.id } })
      load()
    } catch { toast.error('Failed to update') }
  }

  async function handleDelete() {
    if (!deleteConfirm) return
    try {
      await deleteGalleryItem(deleteConfirm)
      await addAuditLog({ userId: appUser!.uid, userName: appUser!.name, userRole: appUser!.role, action: 'deleted gallery item', resource: 'gallery', details: { id: deleteConfirm } })
      toast.success('Deleted')
      setDeleteConfirm(null)
      load()
    } catch { toast.error('Delete failed') }
  }

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-serif text-2xl text-charcoal">Gallery Management</h1>
          <p className="text-sm text-charcoal/50 mt-0.5">
            {isAssistant ? 'Uploads will be submitted for admin approval.' : 'Upload and manage photos and videos.'}
          </p>
        </div>
        {isAssistant && <Badge variant="warning">Assistant — changes require approval</Badge>}
      </div>

      {/* Upload area */}
      <div className="admin-card space-y-4">
        <h2 className="font-semibold text-charcoal text-sm flex items-center gap-2">
          <Upload className="w-4 h-4" /> Upload Media
        </h2>
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-10 text-center cursor-pointer transition-colors ${
            isDragActive ? 'border-primary bg-primary/5' : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <input {...getInputProps()} />
          <div className="flex items-center justify-center gap-3 mb-3 text-gray-300">
            <ImageIcon className="w-8 h-8" />
            <Video className="w-8 h-8" />
          </div>
          <p className="text-sm text-gray-600">
            {isDragActive ? 'Drop files here' : 'Drag & drop photos or videos, or click to browse'}
          </p>
          <p className="text-xs text-gray-400 mt-1">JPG, PNG, WebP, GIF, MP4, MOV · Max 50MB each</p>
        </div>

        {uploading.length > 0 && (
          <div className="space-y-3">
            {uploading.map((item, idx) => (
              <div key={idx} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                {item.type === 'IMAGE'
                  ? <img src={item.preview} alt="" className="w-12 h-12 object-cover rounded" />
                  : <div className="w-12 h-12 bg-gray-700 rounded flex items-center justify-center"><Play className="w-5 h-5 text-white" /></div>
                }
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-charcoal truncate">{item.file.name}</p>
                  <input
                    type="text"
                    placeholder="Add caption (optional)"
                    value={item.caption}
                    onChange={(e) => setUploading((prev) => prev.map((u, i) => i === idx ? { ...u, caption: e.target.value } : u))}
                    className="mt-1 w-full text-xs border border-gray-200 rounded px-2 py-1 focus:outline-none focus:border-primary"
                  />
                  {item.progress > 0 && (
                    <div className="mt-1.5 h-1 bg-gray-200 rounded-full overflow-hidden">
                      <div className="h-full bg-primary transition-all" style={{ width: `${item.progress}%` }} />
                    </div>
                  )}
                </div>
                <button onClick={() => setUploading((prev) => prev.filter((_, i) => i !== idx))} className="text-gray-400 hover:text-red-500">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
            <div className="flex gap-3">
              <Button onClick={uploadAll}>
                {isAssistant ? 'Submit for Approval' : `Upload ${uploading.length} File${uploading.length > 1 ? 's' : ''}`}
              </Button>
              <Button variant="ghost" onClick={() => setUploading([])}>Clear</Button>
            </div>
          </div>
        )}
      </div>

      {/* Gallery grid */}
      <div className="admin-card">
        <h2 className="font-semibold text-charcoal text-sm mb-4">Current Gallery ({items.length} items)</h2>
        {loading ? (
          <SectionLoader />
        ) : items.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <ImageIcon className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm">No gallery items yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {items.map((item) => (
              <div key={item.id} className={`group relative aspect-square rounded-sm overflow-hidden bg-gray-100 ${!item.isActive ? 'opacity-50' : ''}`}>
                {item.type === 'VIDEO'
                  ? <div className="w-full h-full bg-gray-800 flex items-center justify-center"><Play className="w-8 h-8 text-white/60" /></div>
                  : <img src={item.url} alt={item.caption || ''} className="w-full h-full object-cover" loading="lazy" />
                }
                <div className="absolute inset-0 bg-charcoal/0 group-hover:bg-charcoal/60 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                  <button onClick={() => toggleVisibility(item)} className="p-2 bg-white rounded-full text-charcoal hover:bg-gray-100" title={item.isActive ? 'Hide' : 'Show'}>
                    {item.isActive ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                  {!isAssistant && (
                    <button onClick={() => setDeleteConfirm(item.id)} className="p-2 bg-red-600 rounded-full text-white hover:bg-red-700">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                {!item.isActive && (
                  <span className="absolute top-1.5 left-1.5 text-xs bg-gray-900/80 text-white px-1.5 py-0.5 rounded">Hidden</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={handleDelete}
        title="Delete Gallery Item"
        message="This will permanently remove the item from the gallery."
        confirmLabel="Delete"
      />
    </div>
  )
}
