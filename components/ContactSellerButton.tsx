'use client'

import { createClient } from '@/lib/supabase/client'

type Props = {
  listingId: string
  email: string | null
  phone: string | null
}

export function ContactSellerButton({ listingId, email, phone }: Props) {
  async function handleContact() {
    const supabase = createClient()
    await supabase.rpc('increment_listing_enquiries', { listing_uuid: listingId })

    if (email) {
      window.location.href = `mailto:${email}?subject=FurnishAR enquiry`
      return
    }
    if (phone) {
      window.location.href = `tel:${phone}`
    }
  }

  return (
    <button type="button" className="btn-primary" onClick={() => void handleContact()}>
      Contact seller
    </button>
  )
}
