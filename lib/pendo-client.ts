type PendoTrackProps = Record<string, string | number | boolean | undefined>

interface PendoAgent {
  initialize: (options: unknown) => void
  identify: (options: unknown) => void
  clearSession: () => void
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
  getPendo()?.initialize(options)
}

export function pendoIdentify(options: unknown): void {
  getPendo()?.identify(options)
}

export function pendoClearSession(): void {
  getPendo()?.clearSession()
}
