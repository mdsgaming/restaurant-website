// Firebase Cloud Messaging service worker — handles push notifications that
// arrive while the site tab isn't focused (or is closed). Must live at the
// site root so its scope covers the whole origin.
//
// Config values here are the same public Firebase client config already
// shipped in every page's JS bundle — safe to hardcode in a static file,
// since service workers can't read Next.js env vars at runtime.

importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js')

firebase.initializeApp({
  apiKey: 'AIzaSyBIt0OQ6EeExSMWAqcu21O2yy6ucBSLxrk',
  authDomain: 'restaurantwebsite-f6f06.firebaseapp.com',
  projectId: 'restaurantwebsite-f6f06',
  messagingSenderId: '337147034777',
  appId: '1:337147034777:web:ae016b20f7866997b14c08',
})

const messaging = firebase.messaging()

messaging.onBackgroundMessage((payload) => {
  const title = payload.notification?.title || 'Big Treats'
  const body = payload.notification?.body || ''
  const url = payload.fcmOptions?.link || payload.data?.url || '/'

  self.registration.showNotification(title, {
    body,
    icon: '/icon.png',
    badge: '/icon.png',
    data: { url },
  })
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = event.notification.data?.url || '/'
  event.waitUntil(clients.openWindow(url))
})
