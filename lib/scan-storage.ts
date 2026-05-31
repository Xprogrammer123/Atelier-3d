import type { SupabaseClient } from '@supabase/supabase-js'
import { LISTINGS_BUCKET, listingScanVideoPaths } from '@/lib/storage-paths'

export async function downloadListingScanVideo(
  supabase: SupabaseClient,
  listingId: string
): Promise<{ blob: Blob; storagePath: string } | null> {
  for (const storagePath of listingScanVideoPaths(listingId)) {
    const { data, error } = await supabase.storage.from(LISTINGS_BUCKET).download(storagePath)
    if (!error && data) {
      return { blob: data, storagePath }
    }
  }
  return null
}
