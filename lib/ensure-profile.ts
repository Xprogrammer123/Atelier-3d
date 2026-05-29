import type { User } from '@supabase/supabase-js'
import { createServiceClient } from '@/lib/supabase/admin'

/** Ensures a profiles row exists (required for listings FK). */
export async function ensureProfile(user: User): Promise<void> {
  const service = createServiceClient()
  const meta = user.user_metadata ?? {}
  const fullName =
    (typeof meta.full_name === 'string' && meta.full_name) ||
    (typeof meta.name === 'string' && meta.name) ||
    user.email?.split('@')[0] ||
    ''

  const { error } = await service.from('profiles').upsert(
    {
      id: user.id,
      email: user.email ?? null,
      full_name: fullName,
    },
    { onConflict: 'id' }
  )

  if (error) throw error
}
