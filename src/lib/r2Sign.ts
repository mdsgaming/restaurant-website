// Hand-rolled AWS SigV4 presigned PUT URLs using the Web Crypto API, so it runs
// on Cloudflare's Edge Runtime. Verified against the real R2 bucket from Node.
// Content type and content length are signed into the URL when given, so the
// browser's upload must match what was requested.

async function hmacSha256(key: ArrayBuffer | Uint8Array, data: string): Promise<ArrayBuffer> {
  const keyBytes = new Uint8Array(key)
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyBytes as BufferSource,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  return crypto.subtle.sign('HMAC', cryptoKey, new TextEncoder().encode(data) as BufferSource)
}

async function sha256Hex(data: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(data) as BufferSource)
  return toHex(digest)
}

function toHex(buf: ArrayBuffer): string {
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

function amzDate(d: Date): { date: string; dateTime: string } {
  const iso = d.toISOString().replace(/[:-]|\.\d{3}/g, '')
  return { date: iso.slice(0, 8), dateTime: iso }
}

// AWS's percent-encoding: RFC 3986, plus '!' '*' "'" '(' ')' encoded too.
function awsEncode(str: string): string {
  return encodeURIComponent(str).replace(
    /[!'()*]/g,
    (c) => '%' + c.charCodeAt(0).toString(16).toUpperCase()
  )
}

export interface PresignOptions {
  accountId: string
  accessKeyId: string
  secretAccessKey: string
  bucket: string
  key: string
  expiresIn: number
  contentType?: string
  contentLength?: number
}

/** Generates a presigned S3-compatible PUT URL for Cloudflare R2. */
export async function getPresignedPutUrl(opts: PresignOptions): Promise<string> {
  const { accountId, accessKeyId, secretAccessKey, bucket, key, expiresIn, contentType, contentLength } = opts
  const region = 'auto'
  const service = 's3'
  const host = `${bucket}.${accountId}.r2.cloudflarestorage.com`
  const { date, dateTime } = amzDate(new Date())
  const credentialScope = `${date}/${region}/${service}/aws4_request`

  const canonicalUri = '/' + key.split('/').map(awsEncode).join('/')

  // Headers that are signed. Names must be lowercase and sorted.
  const headers: Array<[string, string]> = [['host', host]]
  if (contentType) headers.push(['content-type', contentType])
  if (contentLength !== undefined) headers.push(['content-length', String(contentLength)])
  headers.sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
  const canonicalHeaders = headers.map(([k, v]) => `${k}:${v}\n`).join('')
  const signedHeaders = headers.map(([k]) => k).join(';')

  const queryParams: Record<string, string> = {
    'X-Amz-Algorithm': 'AWS4-HMAC-SHA256',
    'X-Amz-Credential': `${accessKeyId}/${credentialScope}`,
    'X-Amz-Date': dateTime,
    'X-Amz-Expires': String(expiresIn),
    'X-Amz-SignedHeaders': signedHeaders,
  }
  const canonicalQueryString = Object.keys(queryParams)
    .sort()
    .map((k) => `${awsEncode(k)}=${awsEncode(queryParams[k])}`)
    .join('&')

  const canonicalRequest = [
    'PUT',
    canonicalUri,
    canonicalQueryString,
    canonicalHeaders,
    signedHeaders,
    'UNSIGNED-PAYLOAD',
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
