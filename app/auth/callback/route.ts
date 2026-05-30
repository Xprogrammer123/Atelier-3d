import { createClient } from '@/lib/supabase/server'
import { pendoTrackServer } from '@/lib/pendo-server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'
  const oauthError = searchParams.get('error_description') ?? searchParams.get('error')

  const base = (process.env.NEXT_PUBLIC_APP_URL ?? origin).replace(/\/$/, '')

  if (oauthError) {
    return NextResponse.redirect(
      `${base}/auth/login?error=${encodeURIComponent(oauthError)}`
    )
  }

  if (code) {
    const supabase = await createClient()
    const { data: sessionData, error } = await supabase.auth.exchangeCodeForSession(code)

    if (error) {
      return NextResponse.redirect(
        `${base}/auth/login?error=${encodeURIComponent(error.message)}`
      )
    }

    await pendoTrackServer('seller_logged_in', {
      visitorId: sessionData.user?.id,
      properties: {
        auth_method: 'google',
      },
    })
  }

  const safeNext = next.startsWith('/') ? next : '/dashboard'
  return NextResponse.redirect(`${base}${safeNext}`)
}
