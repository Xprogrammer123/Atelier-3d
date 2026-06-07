import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { originFromRequest } from '@/lib/app-url'
import { pendoTrackServer } from '@/lib/pendo-server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'
  const oauthError = searchParams.get('error_description') ?? searchParams.get('error')
  const base = originFromRequest(request)
  const safeNext = next.startsWith('/') ? next : '/dashboard'

  if (oauthError) {
    return NextResponse.redirect(
      `${base}/auth/login?error=${encodeURIComponent(oauthError)}`
    )
  }

  if (!code) {
    return NextResponse.redirect(`${base}/auth/login?error=${encodeURIComponent('Missing auth code')}`)
  }

  let response = NextResponse.redirect(`${base}${safeNext}`)

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.redirect(`${base}${safeNext}`)
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: sessionData, error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    return NextResponse.redirect(
      `${base}/auth/login?error=${encodeURIComponent(error.message)}`
    )
  }

  pendoTrackServer('seller_logged_in', {
    visitorId: sessionData.user?.id,
    properties: {
      auth_method: 'google',
    },
  })

  return response
}
