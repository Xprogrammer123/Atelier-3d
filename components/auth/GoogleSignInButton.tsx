'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type Props = {
  label?: string
  next?: string
}

export function GoogleSignInButton({
  label = 'Continue with Google',
  next = '/dashboard',
}: Props) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleGoogleSignIn() {
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const base =
      process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') ?? window.location.origin
    const redirectTo = `${base}/auth/callback?next=${encodeURIComponent(next)}`

    const { error: authError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    })

    setLoading(false)
    if (authError) {
      setError(authError.message)
    }
  }

  return (
    <div className="auth-oauth">
      <button
        type="button"
        className="btn-google"
        onClick={() => void handleGoogleSignIn()}
        disabled={loading}
      >
        <GoogleIcon />
        {loading ? 'Redirecting…' : label}
      </button>
      {error && <p className="error-msg">{error}</p>}
    </div>
  )
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path
        fill="#FFC107"
        d="M43.611 20.083H42V20H24v8h11.303C33.654 32.657 29.223 36 24 36c-5.522 0-10-4.478-10-10s4.478-10 10-10c2.426 0 4.652.86 6.391 2.286l6.016-6.016C33.64 9.053 29.082 7 24 7 12.954 7 4 15.954 4 27s8.954 20 20 20 20-8.954 20-20c0-1.341-.138-2.651-.389-3.917z"
      />
      <path
        fill="#FF3D00"
        d="M6.306 14.691l6.571 4.819C14.655 16.108 18.961 13 24 13c2.426 0 4.652.86 6.391 2.286l6.016-6.016C33.64 9.053 29.082 7 24 7 16.318 7 9.656 11.337 6.306 14.691z"
      />
      <path
        fill="#4CAF50"
        d="M24 47c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 38.091 26.715 39 24 39c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 42.556 16.227 47 24 47z"
      />
      <path
        fill="#1976D2"
        d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 27c0-1.341-.138-2.651-.389-3.917z"
      />
    </svg>
  )
}
