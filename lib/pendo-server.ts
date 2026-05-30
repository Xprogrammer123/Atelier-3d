const PENDO_TRACK_URL = 'https://data.pendo.io/data/track'
const PENDO_INTEGRATION_KEY = '17825332-b9f3-4ba5-bc23-aa3851e1a733'

export async function pendoTrackServer(
  event: string,
  options: {
    visitorId?: string
    accountId?: string
    properties?: Record<string, unknown>
  } = {}
): Promise<void> {
  const { visitorId = 'system', accountId = 'system', properties } = options
  try {
    await fetch(PENDO_TRACK_URL, {
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
    })
  } catch {
    // Never let tracking break application flow
  }
}
