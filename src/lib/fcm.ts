// Firebase Cloud Messaging (Web Push) sender — Edge Runtime compatible (fetch only).
// Used to notify customers when their order status changes, and to notify
// admin/staff devices when a new order comes in.

function projectId(): string {
  const id = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
  if (!id) throw new Error('NEXT_PUBLIC_FIREBASE_PROJECT_ID is not set')
  return id
}

interface SendOptions {
  token: string
  title: string
  body: string
  url?: string
  data?: Record<string, string>
}

/**
 * Sends a single FCM push message to one device token.
 * Never throws on a bad/expired token — logs and returns false instead,
 * since notification delivery should never break the request it's attached to.
 */
export async function sendFcmMessage(accessToken: string, opts: SendOptions): Promise<boolean> {
  try {
    const res = await fetch(`https://fcm.googleapis.com/v1/projects/${projectId()}/messages:send`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: {
          token: opts.token,
          notification: {
            title: opts.title,
            body: opts.body,
          },
          data: opts.data ?? {},
          webpush: {
            fcm_options: opts.url ? { link: opts.url } : undefined,
            notification: {
              icon: '/icon.png',
            },
          },
        },
      }),
    })
    if (!res.ok) {
      console.error('FCM send failed:', res.status, await res.text())
      return false
    }
    return true
  } catch (err) {
    console.error('FCM send error:', err)
    return false
  }
}

/** Sends the same notification to multiple tokens in parallel. Never throws. */
export async function sendFcmMessageToMany(
  accessToken: string,
  tokens: string[],
  opts: Omit<SendOptions, 'token'>
): Promise<void> {
  await Promise.all(
    tokens.filter(Boolean).map((token) => sendFcmMessage(accessToken, { ...opts, token }))
  )
}
