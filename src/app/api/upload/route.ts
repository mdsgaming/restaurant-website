import { NextRequest, NextResponse } from 'next/server'
import { PutObjectCommand } from '@aws-sdk/client-s3'

export const runtime = 'edge'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { getR2Client, getR2Bucket, getR2PublicUrl, validateUpload } from '@/lib/r2'

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

    const timestamp = Date.now()
    const randomSuffix = Math.random().toString(36).slice(2, 8)
    const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, '_')
    const key = `${folder}/${timestamp}_${randomSuffix}_${safeName}`

    const command = new PutObjectCommand({
      Bucket: getR2Bucket(),
      Key: key,
      ContentType: contentType,
      // ContentLength cannot be set on PutObject presigned URLs in R2 — omit it
    })

    // Presigned URL expires in 5 minutes
    const presignedUrl = await getSignedUrl(getR2Client(), command, { expiresIn: 300 })
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
