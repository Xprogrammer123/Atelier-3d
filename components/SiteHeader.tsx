import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { btnPrimary } from '@/lib/ui'
import { cn } from '@/lib/cn'

export async function SiteHeader() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <header
      className={cn(
        'site-header flex flex-wrap items-center justify-between gap-4',
        'max-w-[1280px] mx-auto px-[clamp(1rem,3vw,1.5rem)] py-[clamp(1rem,3vw,1.5rem)]',
        'max-sm:px-4'
      )}
    >
      <Link
        href="/"
        className="site-brand-link inline-flex items-center gap-[0.65rem] font-display text-[1.35rem] font-semibold text-ink-strong"
      >
        <span
          className="size-[1.4rem] rounded-full bg-accent-clay shadow-[0_0_0_4px_color-mix(in_oklab,var(--color-accent-clay)_18%,transparent)]"
          aria-hidden="true"
        />
        <span>Atelier</span>
      </Link>
      <nav className="flex flex-wrap items-center gap-2" aria-label="Main">
        <Link
          href="/catalogue"
          className="px-[0.85rem] py-[0.45rem] rounded-sm text-[0.82rem] font-semibold tracking-widest text-ink-soft hover:bg-surface-strong hover:text-ink-strong transition-colors"
        >
          Collection
        </Link>
        {user ? (
          <>
            <Link
              href="/dashboard"
              className="px-[0.85rem] py-[0.45rem] rounded-sm text-[0.82rem] font-semibold tracking-widest text-ink-soft hover:bg-surface-strong hover:text-ink-strong transition-colors"
            >
              Dashboard
            </Link>
            <Link
              href="/dashboard/create"
              className="px-[0.85rem] py-[0.45rem] rounded-sm text-[0.82rem] font-semibold tracking-widest text-ink-soft hover:bg-surface-strong hover:text-ink-strong transition-colors"
            >
              Sell
            </Link>
            <form action="/auth/signout" method="post">
              <button
                type="submit"
                className="px-[0.85rem] py-[0.45rem] rounded-sm text-[0.82rem] font-semibold tracking-widest text-ink-soft bg-transparent border-0 hover:bg-surface-strong hover:text-ink-strong transition-colors"
              >
                Sign out
              </button>
            </form>
          </>
        ) : (
          <>
            <Link
              href="/auth/login"
              className="px-[0.85rem] py-[0.45rem] rounded-sm text-[0.82rem] font-semibold tracking-widest text-ink-soft hover:bg-surface-strong hover:text-ink-strong transition-colors"
            >
              Log in
            </Link>
            <Link href="/auth/register" className={cn(btnPrimary, 'px-[0.85rem] py-[0.45rem]')}>
              Register
            </Link>
          </>
        )}
      </nav>
    </header>
  )
}
