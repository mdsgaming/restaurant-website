// NOTE: presigned-URL generation moved to src/lib/r2Sign.ts (hand-rolled
// SigV4 via Web Crypto). @aws-sdk/s3-request-presigner silently produces
// an invalid signature when run in Cloudflare's Edge Runtime — see
// r2Sign.ts for the full explanation.

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
