'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export function PendoInitializer() {
  useEffect(() => {
    pendo.initialize({
      visitor: { id: '' },
    })

    const supabase = createClient()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && session?.user) {
        const user = session.user

        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, email, phone, location, created_at, updated_at')
          .eq('id', user.id)
          .single()

        pendo.identify({
          visitor: {
            id: user.id,
            email: profile?.email ?? user.email ?? '',
            full_name: profile?.full_name ?? '',
            phone: profile?.phone ?? '',
            location: profile?.location ?? '',
            createdAt: profile?.created_at ?? '',
            updatedAt: profile?.updated_at ?? '',
          },
        })
      }

      if (event === 'SIGNED_OUT') {
        pendo.clearSession()
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  return null
}
