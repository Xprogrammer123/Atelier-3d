type PendoTrackProps = Record<string, string | number | boolean | undefined>

interface PendoAgent {
  initialize: (options: unknown) => void
  identify: (options: unknown) => void
  clearSession: () => void
  pageLoad: () => void
  track: (eventName: string, properties?: PendoTrackProps) => void
}

declare global {
  interface Window {
    pendo?: PendoAgent
  }
}

function getPendo(): PendoAgent | undefined {
  if (typeof window === 'undefined') return undefined
  return window.pendo
}

export function pendoTrack(eventName: string, properties?: PendoTrackProps): void {
  getPendo()?.track(eventName, properties)
}

export function pendoInitialize(options: unknown): void {
  const pendo = getPendo()
  if (pendo) {
    pendo.initialize(options)
    return
  }

  // Retry if the stub hasn't been created yet
  let retries = 0
  const maxRetries = 10
  const interval = setInterval(() => {
    retries++
    const p = getPendo()
    if (p) {
      clearInterval(interval)
      p.initialize(options)
    } else if (retries >= maxRetries) {
      clearInterval(interval)
    }
  }, 50)
}

export function pendoIdentify(options: unknown): void {
  getPendo()?.identify(options)
}

export function pendoPageLoad(): void {
  getPendo()?.pageLoad()
}

export function pendoClearSession(): void {
  getPendo()?.clearSession()
}

const ANONYMOUS_VISITOR_KEY = 'atelier_anonymous_visitor_id'

/** Stable anonymous ID for buyer sessions before login (no PII). */
export function getAnonymousVisitorId(): string {
  if (typeof window === 'undefined') return 'anonymous'

  try {
    let id = localStorage.getItem(ANONYMOUS_VISITOR_KEY)
    if (!id) {
      id = crypto.randomUUID()
      localStorage.setItem(ANONYMOUS_VISITOR_KEY, id)
    }
    return id
  } catch {
    return crypto.randomUUID()
  }
}
