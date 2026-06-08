import { cookies } from 'next/headers'

const PENDO_TRACK_URL = 'https://data.pendo.io/data/track'
const PENDO_INTEGRATION_KEY = '17825332-b9f3-4ba5-bc23-aa3851e1a733'
const PENDO_APP_ID = '4fe71006-306d-4ca4-acd4-a4a7cff34280'
const PENDO_TIMEOUT_MS = 2500

export async function pendoTrackServer(
  event: string,
  options: {
    visitorId?: string
    accountId?: string
    properties?: Record<string, unknown>
  } = {}
): Promise<void> {
  let { visitorId, accountId = 'system', properties } = options

  if (!visitorId) {
    const cookieStore = await cookies()
    visitorId = cookieStore.get('pendo_visitor_id')?.value ?? 'anonymous'
  }

  void fetch(PENDO_TRACK_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-pendo-integration-key': PENDO_INTEGRATION_KEY,
    },
    body: JSON.stringify({
      type: 'track',
      event,
      visitorId,
      accountId,
      appId: PENDO_APP_ID,
      timestamp: Date.now(),
      properties,
    }),
    signal: AbortSignal.timeout(PENDO_TIMEOUT_MS),
  }).catch(() => {
    // Never let tracking block or slow application flow
  })
}
