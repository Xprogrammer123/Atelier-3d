import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { originFromRequest } from '@/lib/app-url'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const next = searchParams.get('next') ?? '/dashboard'
  const safeNext = next.startsWith('/') ? next : '/dashboard'
  const origin = originFromRequest(request)
  const redirectTo = `${origin}/auth/callback?next=${encodeURIComponent(safeNext)}`

  let cookieResponse = NextResponse.next()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
    },
  })

  if (error) {
    return NextResponse.redirect(
      `${origin}/auth/login?error=${encodeURIComponent(error.message)}`
    )
  }

  if (!data.url) {
    return NextResponse.redirect(
      `${origin}/auth/login?error=${encodeURIComponent('Could not start Google sign-in')}`
    )
  }

  const response = NextResponse.redirect(data.url)
  cookieResponse.cookies.getAll().forEach((cookie) => {
    response.cookies.set(cookie)
  })
  return response
}
