export function DbSetupBanner() {
  return (
    <div
      className="max-w-[42rem] mb-6 p-6 border border-accent-clay rounded-lg bg-[color-mix(in_oklab,var(--color-accent-peach)_40%,var(--color-surface-paper))] grid gap-3"
      role="alert"
    >
      <h2 className="m-0 font-display text-[1.4rem]">Database setup required</h2>
      <p className="m-0 text-[0.92rem]">
        Supabase is connected, but the Atelier tables have not been created yet.
      </p>
      <ol className="m-0 pl-5 text-[0.88rem] list-decimal">
        <li>
          Open your{' '}
          <a
            href="https://supabase.com/dashboard"
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
          >
            Supabase SQL Editor
          </a>
        </li>
        <li>
          Run{' '}
          <code className="text-[0.85em] px-[0.4em] py-[0.15em] rounded-xs bg-surface-strong border border-line">
            supabase/migrations/001_initial.sql
          </code>
        </li>
        <li>
          Run{' '}
          <code className="text-[0.85em] px-[0.4em] py-[0.15em] rounded-xs bg-surface-strong border border-line">
            supabase/storage.sql
          </code>{' '}
          (creates the <code className="text-[0.85em] px-[0.4em] py-[0.15em] rounded-xs bg-surface-strong border border-line">listings</code> storage bucket)
        </li>
        <li>
          Enable Realtime for{' '}
          <code className="text-[0.85em] px-[0.4em] py-[0.15em] rounded-xs bg-surface-strong border border-line">
            processing_jobs
          </code>{' '}
          in Database → Replication
        </li>
        <li>Refresh this page</li>
      </ol>
      <p className="m-0 text-[0.8rem] text-ink-muted">See README.md in the project root for full setup steps.</p>
    </div>
  )
}
