import { createClient } from '@/lib/supabase/server'
import { originFromRequest } from '@/lib/app-url'
import { NextResponse, type NextRequest } from 'next/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  await supabase.auth.signOut()
  return NextResponse.redirect(new URL('/', originFromRequest(request)))
}
