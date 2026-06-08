'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useState } from 'react'
import { GoogleSignInButton } from '@/components/auth/GoogleSignInButton'
import { createClient } from '@/lib/supabase/client'
import { pendoTrack } from '@/lib/pendo-client'
import { btnPrimary, formField, formInput, formLabel, pageShell, pageTitle } from '@/lib/ui'
import { cn } from '@/lib/cn'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const urlError = searchParams.get('error')

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(urlError)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const supabase = createClient()
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (authError) {
      setError(authError.message)
      return
    }
    pendoTrack('seller_logged_in', {
      auth_method: 'email',
    })
    router.push('/dashboard')
    router.refresh()
  }

  return (
    <main className={pageShell}>
      <div className="max-w-sm mx-auto my-8 p-8 border border-line rounded-lg bg-surface-paper grid gap-4">
        <h1 className={cn(pageTitle, 'text-[1.8rem]')}>Log in</h1>

        <GoogleSignInButton />

        <div className="flex items-center gap-3 text-ink-muted text-xs uppercase tracking-widest">
          <span className="flex-1 h-px bg-line" />
          <span>or</span>
          <span className="flex-1 h-px bg-line" />
        </div>

        <form onSubmit={(e) => void handleSubmit(e)} className="grid gap-4">
          <div className={formField}>
            <label htmlFor="email" className={formLabel}>
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={formInput}
            />
          </div>
          <div className={formField}>
            <label htmlFor="password" className={formLabel}>
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={formInput}
            />
          </div>
          {error && <p className="m-0 text-[#8b2e1f] text-[0.85rem]">{error}</p>}
          <button id="btn-login-email" type="submit" className={btnPrimary} disabled={loading}>
            {loading ? 'Signing in…' : 'Log in with email'}
          </button>
        </form>
        <p className="m-0 text-[0.85rem]">
          New seller? <Link href="/auth/register" className="underline hover:text-accent-clay">Register</Link>
        </p>
      </div>
    </main>
  )
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <main className={cn(pageShell, 'max-w-sm mx-auto my-8 p-8 border border-line rounded-lg bg-surface-paper')}>
          Loading…
        </main>
      }
    >
      <LoginForm />
    </Suspense>
  )
}
