import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export async function SiteHeader() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <header className="site-header">
      <Link href="/" className="site-brand">
        <span className="site-brand__mark" aria-hidden="true" />
        <span>FurnishAR</span>
      </Link>
      <nav className="site-nav" aria-label="Main">
        <Link href="/catalogue">Shop</Link>
        {user ? (
          <>
            <Link href="/dashboard">Dashboard</Link>
            <Link href="/dashboard/create">Sell</Link>
            <form action="/auth/signout" method="post">
              <button type="submit" className="link-btn">
                Sign out
              </button>
            </form>
          </>
        ) : (
          <>
            <Link href="/auth/login">Log in</Link>
            <Link href="/auth/register" className="btn-primary" style={{ padding: '0.45rem 0.85rem' }}>
              Register
            </Link>
          </>
        )}
      </nav>
    </header>
  )
}
