const PENDO_TRACK_URL = 'https://data.pendo.io/data/track'
const PENDO_INTEGRATION_KEY = '17825332-b9f3-4ba5-bc23-aa3851e1a733'
const PENDO_TIMEOUT_MS = 2500

export function pendoTrackServer(
  event: string,
  options: {
    visitorId?: string
    accountId?: string
    properties?: Record<string, unknown>
  } = {}
): void {
  const { visitorId = 'system', accountId = 'system', properties } = options

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
      timestamp: Date.now(),
      properties,
    }),
    signal: AbortSignal.timeout(PENDO_TIMEOUT_MS),
  }).catch(() => {
    // Never let tracking block or slow application flow
  })
}
