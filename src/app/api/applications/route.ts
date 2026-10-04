import { NextRequest, NextResponse } from 'next/server'
import { fsAdd } from '@/lib/firestoreRest'
import { getGoogleAccessToken } from '@/lib/googleAuth'

export const runtime = 'edge'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const MAX_TEXT_LEN = 200
const MAX_MESSAGE_LEN = 2000

export async function POST(req: NextRequest) {
  try {
    const { jobId, jobTitle, applicantName, email, phone, coverMessage, answers, resumeUrl } = await req.json()

    if (!jobId || !applicantName?.trim() || !email?.trim() || !phone?.trim()) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (!EMAIL_RE.test(email.trim())) {
      return NextResponse.json({ error: 'Enter a valid email address' }, { status: 400 })
    }

    // SECURITY: resumeUrl is rendered as a clickable link in the admin
    // panel — only accept a URL that actually points at our own R2 bucket,
    // never an arbitrary attacker-supplied string (e.g. a javascript: URI).
    const r2PublicUrl = process.env.NEXT_PUBLIC_R2_PUBLIC_URL
    let cleanResumeUrl = ''
    if (typeof resumeUrl === 'string' && resumeUrl.trim()) {
      const candidate = resumeUrl.trim()
      if (r2PublicUrl && candidate.startsWith(r2PublicUrl)) {
        cleanResumeUrl = candidate
      } else {
        return NextResponse.json({ error: 'Invalid resume upload' }, { status: 400 })
      }
    }

    const cleanAnswers = Array.isArray(answers)
      ? answers
          .filter((a) => a && typeof a === 'object' && typeof a.questionId === 'string')
          .slice(0, 50)
          .map((a) => ({
            questionId: String(a.questionId).slice(0, 100),
            label: String(a.label ?? '').slice(0, MAX_TEXT_LEN),
            answer: String(a.answer ?? '').slice(0, MAX_MESSAGE_LEN),
          }))
      : []

    const token = await getGoogleAccessToken()
    const ref = await fsAdd('jobApplications', {
      jobId,
      jobTitle: String(jobTitle || '').slice(0, MAX_TEXT_LEN),
      applicantName: applicantName.trim().slice(0, MAX_TEXT_LEN),
      email: email.trim().slice(0, MAX_TEXT_LEN),
      phone: phone.trim().slice(0, 30),
      coverMessage: (coverMessage?.trim() || '').slice(0, MAX_MESSAGE_LEN),
      answers: cleanAnswers,
      resumeUrl: cleanResumeUrl,
      status: 'NEW',
      createdAt: new Date(),
    }, token)

    return NextResponse.json({ id: ref.id }, { status: 201 })
  } catch (error) {
    console.error('[POST /api/applications]', error)
    return NextResponse.json({ error: 'Failed to submit application' }, { status: 500 })
  }
}
