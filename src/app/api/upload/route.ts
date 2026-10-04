import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'edge'

import { getPresignedPutUrl } from '@/lib/r2Sign'
import { getR2Bucket, getR2PublicUrl, validateUpload } from '@/lib/r2'

export async function POST(req: NextRequest) {
  try {
    const { filename, contentType, contentLength, folder = 'uploads' } = await req.json()

    if (!filename || !contentType) {
      return NextResponse.json(
        { error: 'filename and contentType are required' },
        { status: 400 }
      )
    }

    const validationError = validateUpload(contentType, contentLength ?? 0, folder)
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 })
    }

    const accountId = process.env.CLOUDFLARE_R2_ACCOUNT_ID
    const accessKeyId = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID
    const secretAccessKey = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY
    if (!accountId || !accessKeyId || !secretAccessKey) {
      throw new Error('Missing Cloudflare R2 environment variables')
    }

    const timestamp = Date.now()
    const randomSuffix = Math.random().toString(36).slice(2, 8)
    const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, '_')
    const key = `${folder}/${timestamp}_${randomSuffix}_${safeName}`

    // Presigned URL expires in 5 minutes
    const presignedUrl = await getPresignedPutUrl({
      accountId,
      accessKeyId,
      secretAccessKey,
      bucket: getR2Bucket(),
      key,
      expiresIn: 300,
    })
    const publicUrl = `${getR2PublicUrl()}/${key}`

    return NextResponse.json({ presignedUrl, publicUrl, key })
  } catch (error) {
    console.error('R2 upload presign error:', error)
    return NextResponse.json(
      { error: 'Failed to generate upload URL' },
      { status: 500 }
    )
  }
}
