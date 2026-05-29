export function DbSetupBanner() {
  return (
    <div
      className="form-card"
      style={{
        maxWidth: '42rem',
        marginBottom: '1.5rem',
        borderColor: 'var(--accent-clay)',
        background: 'color-mix(in oklab, var(--accent-peach) 40%, var(--surface-paper))',
      }}
      role="alert"
    >
      <h2 style={{ margin: '0 0 0.5rem', fontFamily: 'var(--font-display)', fontSize: '1.4rem' }}>
        Database setup required
      </h2>
      <p style={{ margin: '0 0 0.75rem', fontSize: '0.92rem' }}>
        Supabase is connected, but the Atelier tables have not been created yet.
      </p>
      <ol style={{ margin: '0 0 0.75rem', paddingLeft: '1.25rem', fontSize: '0.88rem' }}>
        <li>
          Open your{' '}
          <a
            href="https://supabase.com/dashboard"
            target="_blank"
            rel="noopener noreferrer"
            style={{ textDecoration: 'underline' }}
          >
            Supabase SQL Editor
          </a>
        </li>
        <li>
          Run <code>supabase/migrations/001_initial.sql</code>
        </li>
        <li>
          Run <code>supabase/storage.sql</code> (creates the <code>listings</code> storage bucket)
        </li>
        <li>Enable Realtime for <code>processing_jobs</code> in Database → Replication</li>
        <li>Refresh this page</li>
      </ol>
      <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--ink-muted)' }}>
        See README.md in the project root for full setup steps.
      </p>
    </div>
  )
}
