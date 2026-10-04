// Hand-rolled AWS SigV4 presigned-URL generation using the Web Crypto API.
//
// @aws-sdk/s3-request-presigner relies on Node.js-targeted crypto internals
// that silently compute an incorrect signature when bundled for Cloudflare's
// Edge Runtime — it doesn't throw, it just produces a presigned URL that R2
// rejects with SignatureDoesNotMatch. Confirmed by comparing a presigned
// URL generated in real Node.js (valid, upload succeeds) against the exact
// same code path running on the deployed Edge function (invalid, every
// time) with matching credentials. This mirrors why firebase-admin had to
// be replaced with REST + Web Crypto earlier in this project (see
// googleAuth.ts) — same root cause, different SDK.

// This TS lib's BufferSource typing wants an ArrayBuffer-backed view
// specifically, while Uint8Array's own type reports the broader
// ArrayBufferLike (which also covers SharedArrayBuffer) — a type-checker
// pedantry mismatch only, not a runtime concern, since every value here is
// always a plain, freshly allocated ArrayBuffer. Cast once at the boundary
// rather than scattering casts through every call site.
function asBufferSource(data: Uint8Array | ArrayBuffer): BufferSource {
  return data as BufferSource
}

async function hmacSha256(key: ArrayBuffer | Uint8Array, data: string): Promise<ArrayBuffer> {
  const keyBytes = new Uint8Array(key)
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    asBufferSource(keyBytes),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  return crypto.subtle.sign('HMAC', cryptoKey, asBufferSource(new TextEncoder().encode(data)))
}

async function sha256Hex(data: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', asBufferSource(new TextEncoder().encode(data)))
  return toHex(digest)
}

function toHex(buf: ArrayBuffer): string {
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

function amzDate(d: Date): { date: string; dateTime: string } {
  const iso = d.toISOString().replace(/[:-]|\.\d{3}/g, '')
  return { date: iso.slice(0, 8), dateTime: iso }
}

// AWS's flavor of percent-encoding: RFC 3986 plus encoding '!' '*' "'" '('
// ')', which encodeURIComponent leaves alone.
function awsEncode(str: string): string {
  return encodeURIComponent(str).replace(
    /[!'()*]/g,
    (c) => '%' + c.charCodeAt(0).toString(16).toUpperCase()
  )
}

interface PresignOptions {
  accountId: string
  accessKeyId: string
  secretAccessKey: string
  bucket: string
  key: string
  expiresIn: number
}

/** Generates a presigned S3-compatible PUT URL for Cloudflare R2. */
export async function getPresignedPutUrl(opts: PresignOptions): Promise<string> {
  const { accountId, accessKeyId, secretAccessKey, bucket, key, expiresIn } = opts
  const region = 'auto'
  const service = 's3'
  const host = `${bucket}.${accountId}.r2.cloudflarestorage.com`
  const { date, dateTime } = amzDate(new Date())
  const credentialScope = `${date}/${region}/${service}/aws4_request`

  const canonicalUri = '/' + key.split('/').map(awsEncode).join('/')

  const queryParams: Record<string, string> = {
    'X-Amz-Algorithm': 'AWS4-HMAC-SHA256',
    'X-Amz-Credential': `${accessKeyId}/${credentialScope}`,
    'X-Amz-Date': dateTime,
    'X-Amz-Expires': String(expiresIn),
    'X-Amz-SignedHeaders': 'host',
  }
  const canonicalQueryString = Object.keys(queryParams)
    .sort()
    .map((k) => `${awsEncode(k)}=${awsEncode(queryParams[k])}`)
    .join('&')

  const canonicalHeaders = `host:${host}\n`
  const signedHeaders = 'host'
  const payloadHash = 'UNSIGNED-PAYLOAD'

  const canonicalRequest = [
    'PUT',
    canonicalUri,
    canonicalQueryString,
    canonicalHeaders,
    signedHeaders,
    payloadHash,
  ].join('\n')

  const stringToSign = [
    'AWS4-HMAC-SHA256',
    dateTime,
    credentialScope,
    await sha256Hex(canonicalRequest),
  ].join('\n')

  const kDate = await hmacSha256(new TextEncoder().encode('AWS4' + secretAccessKey), date)
  const kRegion = await hmacSha256(kDate, region)
  const kService = await hmacSha256(kRegion, service)
  const kSigning = await hmacSha256(kService, 'aws4_request')
  const signature = toHex(await hmacSha256(kSigning, stringToSign))

  return `https://${host}${canonicalUri}?${canonicalQueryString}&X-Amz-Signature=${signature}`
}
