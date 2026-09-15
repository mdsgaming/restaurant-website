import { NextRequest, NextResponse } from 'next/server'
import { fsAdd } from '@/lib/firestoreRest'
import { getGoogleAccessToken } from '@/lib/googleAuth'

export const runtime = 'edge'

export async function POST(req: NextRequest) {
  try {
    const { jobId, jobTitle, applicantName, email, phone, coverMessage } = await req.json()

    if (!jobId || !applicantName?.trim() || !email?.trim() || !phone?.trim()) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const token = await getGoogleAccessToken()
    const ref = await fsAdd('jobApplications', {
      jobId,
      jobTitle: jobTitle || '',
      applicantName: applicantName.trim(),
      email: email.trim(),
      phone: phone.trim(),
      coverMessage: coverMessage?.trim() || '',
      status: 'NEW',
      createdAt: new Date(),
    }, token)

    return NextResponse.json({ id: ref.id }, { status: 201 })
  } catch (error) {
    console.error('[POST /api/applications]', error)
    return NextResponse.json({ error: 'Failed to submit application' }, { status: 500 })
  }
}
