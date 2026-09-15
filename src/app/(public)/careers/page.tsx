import { Metadata } from 'next'
import { CareersContent } from './CareersContent'

export const metadata: Metadata = {
  title: 'Careers — Big Treats African Restaurants',
  description: 'Join our team at Big Treats African Restaurants. View open positions and apply today.',
}

export default function CareersPage() {
  return <CareersContent />
}
