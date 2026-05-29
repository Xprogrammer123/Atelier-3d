import type { PostgrestError } from '@supabase/supabase-js'

export type DbSetupIssue = 'tables_missing' | 'unknown'

export function parseDbError(error: PostgrestError | null): DbSetupIssue | null {
  if (!error) return null
  if (error.code === 'PGRST205' || error.message?.includes('schema cache')) {
    return 'tables_missing'
  }
  return 'unknown'
}

export function isDbSetupError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false
  const e = error as PostgrestError
  return e.code === 'PGRST205' || Boolean(e.message?.includes('schema cache'))
}
