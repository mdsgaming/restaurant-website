export const runtime = 'edge'

import { Metadata } from 'next'
import { CateringContent } from './CateringContent'

export const metadata: Metadata = {
  title: 'Catering Services',
  description:
    'Big Treats caters weddings, birthdays, corporate events, and more with authentic African cuisine. Tell us about your event and we will reach out.',
}

export default function CateringPage() {
  return <CateringContent />
}
