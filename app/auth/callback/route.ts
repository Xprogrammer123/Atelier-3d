import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

function getBaseUrl(request: NextRequest): string {
  const envUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '')
  if (envUrl && !envUrl.includes('localhost')) {
    return envUrl
  }

  const forwardedHost = request.headers.get('x-forwarded-host')
  const forwardedProto = request.headers.get('x-forwarded-proto') ?? 'https'
  if (forwardedHost) {
    return `${forwardedProto}://${forwardedHost}`
  }

  return new URL(request.url).origin
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'
  const oauthError = searchParams.get('error_description') ?? searchParams.get('error')
  const base = getBaseUrl(request)
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

  const { error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    return NextResponse.redirect(
      `${base}/auth/login?error=${encodeURIComponent(error.message)}`
    )
  }

  return response
}
