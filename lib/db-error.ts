import type { PostgrestError } from '@supabase/supabase-js'

export function isDbSetupError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false
  const e = error as PostgrestError
  return e.code === 'PGRST205' || Boolean(e.message?.includes('schema cache'))
}
