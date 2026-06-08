import { NextResponse } from 'next/server'
import { deleteListingForSeller } from '@/lib/delete-listing'
import { createClient } from '@/lib/supabase/server'

type Params = { params: Promise<{ id: string }> }

export async function DELETE(_request: Request, { params }: Params) {
  const { id } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const result = await deleteListingForSeller(id, user.id)

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status })
  }

  return NextResponse.json({ ok: true })
}
