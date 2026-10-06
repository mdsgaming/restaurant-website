import { NextRequest, NextResponse } from 'next/server'
import { fsAdd, fsQuery, fsList } from '@/lib/firestoreRest'
import { getGoogleAccessToken } from '@/lib/googleAuth'
import { sendFcmMessageToMany } from '@/lib/fcm'
import { verifyStaffAuth } from '@/lib/verifyStaffAuth'
import {
  CONTACT_TIMES,
  CONTACT_METHODS,
  EVENT_TYPES,
  SERVICE_STYLES,
  BUDGETS,
  MAX_GUESTS,
  isOption,
} from '@/lib/catering'

export const runtime = 'edge'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/
const ADMIN_ROLES = ['ADMIN', 'DEVELOPER']

function text(value: unknown, max: number): string {
  return typeof value === 'string' ? value.trim().slice(0, max) : ''
}

// Public: anyone can submit a catering request.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    const name = text(body.name, 100)
    const email = text(body.email, 200)
    const phone = text(body.phone, 30)
    const eventDate = text(body.eventDate, 10)
    const eventTime = text(body.eventTime, 5)
    const guestCount = Number(body.guestCount)

    if (!name) return NextResponse.json({ error: 'Please enter your name.' }, { status: 400 })
    if (!EMAIL_RE.test(email)) return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 })
    if (phone.replace(/\D/g, '').length < 7) {
      return NextResponse.json({ error: 'Please enter a valid phone number.' }, { status: 400 })
    }
    if (!isOption(CONTACT_TIMES, body.contactTime)) {
      return NextResponse.json({ error: 'Please choose when we should contact you.' }, { status: 400 })
    }
    if (!isOption(CONTACT_METHODS, body.contactMethod)) {
      return NextResponse.json({ error: 'Please choose how we should contact you.' }, { status: 400 })
    }
    if (!isOption(EVENT_TYPES, body.eventType)) {
      return NextResponse.json({ error: 'Please choose the type of event.' }, { status: 400 })
    }
    if (!isOption(SERVICE_STYLES, body.serviceStyle)) {
      return NextResponse.json({ error: 'Please choose a service style.' }, { status: 400 })
    }
    const budget = isOption(BUDGETS, body.budget) ? body.budget : 'UNSURE'

    if (!Number.isInteger(guestCount) || guestCount < 1 || guestCount > MAX_GUESTS) {
      return NextResponse.json({ error: `Guest count must be between 1 and ${MAX_GUESTS}.` }, { status: 400 })
    }

    // Event date must be a real calendar date, not in the past, and within
    // two years. A day of slack covers timezone differences.
    const parsedDate = new Date(`${eventDate}T12:00:00Z`)
    const dayMs = 24 * 60 * 60 * 1000
    if (!DATE_RE.test(eventDate) || Number.isNaN(parsedDate.getTime()) || parsedDate.toISOString().slice(0, 10) !== eventDate) {
      return NextResponse.json({ error: 'Please choose the date of your event.' }, { status: 400 })
    }
    if (parsedDate.getTime() < Date.now() - dayMs) {
      return NextResponse.json({ error: 'The event date is in the past.' }, { status: 400 })
    }
    if (parsedDate.getTime() > Date.now() + 2 * 365 * dayMs) {
      return NextResponse.json({ error: 'Please choose a date within the next two years.' }, { status: 400 })
    }
    if (eventTime && !TIME_RE.test(eventTime)) {
      return NextResponse.json({ error: 'Please enter a valid event start time.' }, { status: 400 })
    }

    const token = await getGoogleAccessToken()
    const ref = await fsAdd('cateringRequests', {
      name,
      email,
      phone,
      contactMethod: body.contactMethod,
      contactTime: body.contactTime,
      eventDate,
      eventTime,
      eventType: body.eventType,
      guestCount,
      serviceStyle: body.serviceStyle,
      eventLocation: text(body.eventLocation, 300),
      budget,
      dietaryNeeds: text(body.dietaryNeeds, 500),
      menuInterests: text(body.menuInterests, 500),
      additionalDetails: text(body.additionalDetails, 2000),
      status: 'NEW',
      adminNotes: '',
      createdAt: new Date(),
    }, token)

    // Notify staff devices. Never let a notification failure fail the request.
    try {
      const adminTokens = (await fsList('adminFcmTokens', token))
        .map((d) => d.token)
        .filter((t): t is string => typeof t === 'string' && t.length > 0)
      if (adminTokens.length > 0) {
        await sendFcmMessageToMany(token, adminTokens, {
          title: 'New Catering Request',
          body: `${name} — ${EVENT_TYPES[body.eventType as keyof typeof EVENT_TYPES]}, ${guestCount} guests on ${eventDate}`,
          url: '/admin/catering',
          data: { cateringId: ref.id },
        })
      }
    } catch (notifyErr) {
      console.error('[POST /api/catering] admin notify failed:', notifyErr)
    }

    return NextResponse.json({ id: ref.id }, { status: 201 })
  } catch (error) {
    console.error('[POST /api/catering]', error)
    return NextResponse.json({ error: 'Something went wrong sending your request. Please try again or call us.' }, { status: 500 })
  }
}

// Admins only: list catering requests, newest first.
export async function GET(req: NextRequest) {
  const staff = await verifyStaffAuth(req)
  if (!staff) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!ADMIN_ROLES.includes(staff.role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  try {
    const token = await getGoogleAccessToken()
    const requests = await fsQuery('cateringRequests', {
      orderBy: [['createdAt', 'DESCENDING']],
      limit: 200,
    }, token)
    return NextResponse.json(requests)
  } catch (error) {
    console.error('[GET /api/catering]', error)
    return NextResponse.json({ error: 'Failed to load catering requests' }, { status: 500 })
  }
}
