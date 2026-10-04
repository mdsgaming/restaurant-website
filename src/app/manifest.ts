import type { MetadataRoute } from 'next'

// Next.js App Router auto-serves this at /manifest.webmanifest.
// A web app manifest is required for iOS Safari (and Chrome/Opera on iOS,
// which all run on the same WebKit engine) to let someone "Add to Home
// Screen" and get a real installed app — which is the only way push
// notifications work at all on iOS.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Big Treats African Restaurants',
    short_name: 'Big Treats',
    description: 'Authentic African cuisine — order online, track your order, and get notified when it\'s ready.',
    start_url: '/',
    display: 'standalone',
    background_color: '#1a0a0a',
    theme_color: '#1a0a0a',
    icons: [
      {
        src: '/icon.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icon.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  }
}
