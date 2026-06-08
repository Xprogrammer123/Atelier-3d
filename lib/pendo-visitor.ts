import { cookies } from 'next/headers'
import { ANONYMOUS_VISITOR_COOKIE } from '@/lib/pendo-constants'

/** Read authenticated user id or anonymous visitor cookie on the server. */
export async function getServerVisitorId(userId?: string | null): Promise<string | undefined> {
  if (userId) return userId

  const cookieStore = await cookies()
  const value = cookieStore.get(ANONYMOUS_VISITOR_COOKIE)?.value
  return value || undefined
}
