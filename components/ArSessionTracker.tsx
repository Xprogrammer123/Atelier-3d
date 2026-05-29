'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export function ArSessionTracker({ listingId }: { listingId: string }) {
  useEffect(() => {
    const supabase = createClient()
    void supabase.rpc('increment_listing_ar_sessions', { listing_uuid: listingId })
  }, [listingId])
  return null
}
