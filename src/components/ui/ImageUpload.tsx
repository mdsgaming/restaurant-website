'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, X, Image as ImageIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'

interface ImageUploadProps {
  onUpload: (url: string) => void
  folder?: string
  currentUrl?: string
  accept?: Record<string, string[]>
  label?: string
  className?: string
}

export function ImageUpload({
  onUpload,
  folder = 'uploads',
  currentUrl,
  accept = { 'image/*': ['.jpg', '.jpeg', '.png', '.webp'] },
  label = 'Upload Image',
  className,
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [preview, setPreview] = useState<string>(currentUrl || '')
  const progressBarRef = useRef<HTMLDivElement>(null)

  // Sync preview when currentUrl prop changes (e.g. after parent fetches saved settings)
  useEffect(() => {
    if (!uploading) setPreview(currentUrl || '')
  }, [currentUrl])

  useEffect(() => {
    if (progressBarRef.current) {
      progressBarRef.current.style.width = `${progress}%`
    }
  }, [progress])

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const file = acceptedFiles[0]
      if (!file) return

      setUploading(true)
      setProgress(10)
      setPreview(URL.createObjectURL(file))

      try {
        // 1. Get presigned URL from our API
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
        setProgress(40)

        // 2. PUT the file directly to R2
        const uploadRes = await fetch(presignedUrl, {
          method: 'PUT',
          headers: { 'Content-Type': file.type },
          body: file,
        })

        if (!uploadRes.ok) throw new Error('Upload to storage failed')

        setProgress(100)
        onUpload(publicUrl)
        setPreview(publicUrl)
        toast.success('File uploaded')
      } catch (e) {
        console.error(e)
        toast.error((e as Error).message || 'Upload failed. Please try again.')
        setPreview(currentUrl || '')
      } finally {
        setUploading(false)
        setProgress(0)
      }
    },
    [folder, onUpload, currentUrl]
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept,
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024,
    disabled: uploading,
  })

  return (
    <div className={cn('space-y-2', className)}>
      {label && <p className="text-sm font-medium text-gray-700">{label}</p>}
      <div
        {...getRootProps()}
        className={cn(
          'border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors',
          isDragActive
            ? 'border-primary bg-primary/5'
            : 'border-gray-200 hover:border-primary/40 hover:bg-gray-50',
          uploading && 'opacity-60 cursor-not-allowed'
        )}
      >
        <input {...getInputProps()} />
        {preview ? (
          <div className="space-y-3">
            <img
              src={preview}
              alt="Preview"
              className="w-full max-h-40 object-contain rounded"
            />
            {!uploading && (
              <p className="text-xs text-gray-500">Click or drag to replace</p>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
              {isDragActive ? (
                <Upload className="w-5 h-5 text-primary" />
              ) : (
                <ImageIcon className="w-5 h-5 text-gray-400" />
              )}
            </div>
            <div>
              <p className="text-sm text-gray-600">
                {isDragActive ? 'Drop file here' : 'Drag & drop or click to browse'}
              </p>
              <p className="text-xs text-gray-400 mt-1">Max 10 MB · JPG, PNG, WebP</p>
            </div>
          </div>
        )}

        {uploading && (
          <div className="mt-3 space-y-1">
            <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div
                ref={progressBarRef}
              className="h-full bg-primary rounded-full transition-all duration-500 w-0"
              />
            </div>
            <p className="text-xs text-gray-500">Uploading…</p>
          </div>
        )}
      </div>
      {preview && !uploading && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            setPreview('')
            onUpload('')
          }}
          className="flex items-center gap-1.5 text-xs text-red-500 hover:text-red-700"
        >
          <X className="w-3.5 h-3.5" /> Remove image
        </button>
      )}
    </div>
  )
}
