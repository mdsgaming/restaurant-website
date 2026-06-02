import type { Metadata } from 'next'
import './globals.css'
import { Providers } from './providers'

export const metadata: Metadata = {
  title: {
    default: 'Big Treats African Restaurants',
    template: '%s | Big Treats',
  },
  description: 'Big Treats African Restaurants serves authentic African cuisine — jollof rice, suya, egusi soup and more. Order online or visit us today.',
  keywords: ['african restaurant', 'jollof rice', 'suya', 'nigerian food', 'african food', 'delivery', 'big treats'],
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: 'Big Treats African Restaurants',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="min-h-screen">
        <div id="page-gradient" aria-hidden="true" />
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
