'use client'

import { createClient } from '@/lib/supabase/client'
import { pendoTrack } from '@/lib/pendo-client'
import { btnPrimary } from '@/lib/ui'

type Props = {
  listingId: string
  email: string | null
  phone: string | null
}

export function ContactSellerButton({ listingId, email, phone }: Props) {
  async function handleContact() {
    const supabase = createClient()
    await supabase.rpc('increment_listing_enquiries', { listing_uuid: listingId })

    const contactMethod = email ? 'email' : phone ? 'phone' : 'unknown'
    pendoTrack('seller_contacted', {
      listing_id: listingId,
      contact_method: contactMethod,
    })

    if (email) {
      window.location.href = `mailto:${email}?subject=Atelier enquiry`
      return
    }
    if (phone) {
      window.location.href = `tel:${phone}`
    }
  }

  return (
    <button type="button" className={btnPrimary} onClick={() => void handleContact()}>
      Contact seller
    </button>
  )
}
