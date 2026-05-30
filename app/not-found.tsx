import Link from 'next/link'
import { btnPrimary, emptyState, pageShell, pageTitle } from '@/lib/ui'
import { cn } from '@/lib/cn'

export default function NotFound() {
  return (
    <main className={pageShell}>
      <div className={emptyState}>
        <h1 className={pageTitle}>Not found</h1>
        <p>This listing may not exist or is not live yet.</p>
        <Link href="/" className={cn(btnPrimary, 'inline-flex mt-4')}>
          Back to catalogue
        </Link>
      </div>
    </main>
  )
}
