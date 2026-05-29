import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import WebSocket from 'ws'

// Node.js < 22 has no native WebSocket — required by @supabase/realtime-js
if (typeof globalThis.WebSocket === 'undefined') {
  ;(globalThis as typeof globalThis & { WebSocket: typeof WebSocket }).WebSocket =
    WebSocket as unknown as typeof globalThis.WebSocket
}

/** Supabase client for Node.js scripts (worker, CLI). */
export function createNodeSupabaseClient(
  url: string,
  key: string
): SupabaseClient {
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}
