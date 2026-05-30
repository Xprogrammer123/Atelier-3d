import { headers } from 'next/headers'
import { resolveConfiguredAppUrl } from '@/lib/app-url'

/** Origin for Server Components (prefers live host over env). */
export async function getSiteOrigin(): Promise<string> {
  const h = await headers()
  const forwardedHost = h.get('x-forwarded-host')
  const forwardedProto = h.get('x-forwarded-proto') ?? 'https'
  if (forwardedHost) {
    return `${forwardedProto}://${forwardedHost.split(',')[0].trim()}`
  }
  const host = h.get('host')
  if (host) {
    const proto = host.startsWith('localhost') ? 'http' : 'https'
    return `${proto}://${host}`
  }
  return resolveConfiguredAppUrl()
}
