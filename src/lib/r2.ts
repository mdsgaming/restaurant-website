import { S3Client } from '@aws-sdk/client-s3'

if (
  !process.env.CLOUDFLARE_R2_ACCOUNT_ID ||
  !process.env.CLOUDFLARE_R2_ACCESS_KEY_ID ||
  !process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY
) {
  throw new Error('Missing Cloudflare R2 environment variables')
}

export const r2Client = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.CLOUDFLARE_R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY,
  },
})

export const R2_BUCKET = process.env.CLOUDFLARE_R2_BUCKET_NAME!
export const R2_PUBLIC_URL = process.env.NEXT_PUBLIC_R2_PUBLIC_URL!

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'video/mp4',
  'video/quicktime',
  'video/webm',
])

const MAX_SIZES: Record<string, number> = {
  gallery: 50 * 1024 * 1024,  // 50 MB
  menu: 10 * 1024 * 1024,     // 10 MB
  branding: 10 * 1024 * 1024, // 10 MB
  about: 10 * 1024 * 1024,    // 10 MB
  uploads: 20 * 1024 * 1024,  // 20 MB
}

export function validateUpload(
  contentType: string,
  contentLength: number,
  folder: string
): string | null {
  if (!ALLOWED_MIME_TYPES.has(contentType)) {
    return `File type "${contentType}" is not allowed`
  }
  const maxSize = MAX_SIZES[folder] ?? MAX_SIZES.uploads
  if (contentLength > maxSize) {
    return `File exceeds the ${maxSize / 1024 / 1024} MB limit for this folder`
  }
  return null
}
