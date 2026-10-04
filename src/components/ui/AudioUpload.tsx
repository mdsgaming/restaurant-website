'use client'

import { useRef, useState } from 'react'
import { Upload, X, Music, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'

interface AudioUploadProps {
  onUpload: (url: string) => void
  currentUrl?: string
  label?: string
  folder?: string
}

export function AudioUpload({ onUpload, currentUrl, label, folder = 'sounds' }: AudioUploadProps) {
  const [uploading, setUploading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleFile(file: File) {
    setUploading(true)
    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: file.name,
          contentType: file.type,
          contentLength: file.size,
          folder,
        }),
      })
      if (!res.ok) {
        const { error } = await res.json()
        throw new Error(error || 'Failed to get upload URL')
      }
      const { presignedUrl, publicUrl } = await res.json()

      const uploadRes = await fetch(presignedUrl, {
        method: 'PUT',
        headers: { 'Content-Type': file.type },
        body: file,
      })
      if (!uploadRes.ok) throw new Error('Upload to storage failed')

      onUpload(publicUrl)
      toast.success('Sound uploaded')
    } catch (e) {
      toast.error((e as Error).message || 'Upload failed. Please try again.')
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <div className="space-y-2">
      {label && <p className="text-sm font-medium text-gray-700">{label}</p>}

      {currentUrl ? (
        <div className="flex items-center gap-3 border border-gray-200 rounded-lg p-3">
          <Music className="w-5 h-5 text-primary shrink-0" />
          <audio controls src={currentUrl} className="h-9 flex-1 min-w-0" />
          <button
            type="button"
            onClick={() => onUpload('')}
            className="text-gray-400 hover:text-red-500 shrink-0"
            aria-label="Remove sound"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="w-full border-2 border-dashed border-gray-200 rounded-lg p-4 flex items-center justify-center gap-2 text-sm text-gray-500 hover:border-primary/40 hover:bg-gray-50 transition-colors disabled:opacity-60"
        >
          {uploading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" /> Uploading…
            </>
          ) : (
            <>
              <Upload className="w-4 h-4" /> Click to upload a sound (MP3, WAV, max 8MB)
            </>
          )}
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="audio/mpeg,audio/mp3,audio/wav,audio/ogg,audio/mp4,audio/x-m4a,.mp3,.wav,.ogg,.m4a"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) handleFile(file)
        }}
      />
    </div>
  )
}
