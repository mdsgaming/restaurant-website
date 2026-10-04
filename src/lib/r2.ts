import { S3Client } from '@aws-sdk/client-s3'

let _r2Client: S3Client | null = null

export function getR2Client(): S3Client {
  if (!_r2Client) {
    if (
      !process.env.CLOUDFLARE_R2_ACCOUNT_ID ||
      !process.env.CLOUDFLARE_R2_ACCESS_KEY_ID ||
      !process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY
    ) {
      throw new Error('Missing Cloudflare R2 environment variables')
    }
    _r2Client = new S3Client({
      region: 'auto',
      endpoint: `https://${process.env.CLOUDFLARE_R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID,
        secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY,
      },
      // Without this, the SDK auto-attaches an x-amz-checksum-crc32 param to
      // every presigned PutObject URL (computed as if the body were empty,
      // since it doesn't have the real file yet). The browser's actual PUT
      // never sends a matching checksum header, so R2 rejects the upload
      // with SignatureDoesNotMatch — which shows up in the browser as a
      // CORS-flavored "Failed to fetch". WHEN_REQUIRED only computes
      // checksums when an operation truly needs one, which PutObject doesn't.
      requestChecksumCalculation: 'WHEN_REQUIRED',
    })
  }
  return _r2Client
}

export function getR2Bucket(): string {
  return process.env.CLOUDFLARE_R2_BUCKET_NAME ?? ''
}

export function getR2PublicUrl(): string {
  return process.env.NEXT_PUBLIC_R2_PUBLIC_URL ?? ''
}

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'video/mp4',
  'video/quicktime',
  'video/webm',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'audio/mpeg',
  'audio/mp3',
  'audio/wav',
  'audio/x-wav',
  'audio/ogg',
  'audio/mp4',
  'audio/x-m4a',
])

const MAX_SIZES: Record<string, number> = {
  gallery: 50 * 1024 * 1024,  // 50 MB
  menu: 10 * 1024 * 1024,     // 10 MB
  branding: 10 * 1024 * 1024, // 10 MB
  about: 10 * 1024 * 1024,    // 10 MB
  uploads: 20 * 1024 * 1024,  // 20 MB
  resumes: 8 * 1024 * 1024,   // 8 MB
  sounds: 8 * 1024 * 1024,    // 8 MB
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
