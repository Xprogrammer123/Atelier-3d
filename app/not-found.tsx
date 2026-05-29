import Link from 'next/link'

export default function NotFound() {
  return (
    <main className="page-shell empty-state">
      <h1 className="page-title">Not found</h1>
      <p>This listing may not exist or is not live yet.</p>
      <Link href="/" className="btn-primary">
        Back to catalogue
      </Link>
    </main>
  )
}
