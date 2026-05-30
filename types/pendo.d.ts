export {}

declare global {
  interface Window {
    pendo?: {
      initialize: (options: unknown) => void
      identify: (options: unknown) => void
      clearSession: () => void
      track: (eventName: string, properties?: Record<string, unknown>) => void
    }
  }
}
