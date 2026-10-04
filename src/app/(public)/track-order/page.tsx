export const runtime = 'edge'
export const dynamic = 'force-dynamic'

import { Metadata } from 'next'
import { TrackOrderContent } from './TrackOrderContent'

export const metadata: Metadata = {
  title: 'Track Your Order',
  description: 'Check the status of your Big Treats order using your phone number.',
}

export default function TrackOrderPage() {
  return <TrackOrderContent />
}
