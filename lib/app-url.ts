import type { NextRequest } from 'next/server'

/** Origin from an incoming HTTP request (works on Vercel/proxies). */
export function originFromRequest(request: NextRequest | Request): string {
  const forwardedHost = request.headers.get('x-forwarded-host')
  const forwardedProto = request.headers.get('x-forwarded-proto') ?? 'https'
  if (forwardedHost) {
    return `${forwardedProto}://${forwardedHost.split(',')[0].trim()}`
  }
  return new URL(request.url).origin
}

/** Env-based URL — use for worker/scripts; may be localhost in dev. */
export function resolveConfiguredAppUrl(): string {
  return (process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000').replace(/\/$/, '')
}

/** Browser-only origin — always matches the tab the user is on. */
export function getClientSiteOrigin(): string {
  if (typeof window !== 'undefined') return window.location.origin
  return resolveConfiguredAppUrl()
}
