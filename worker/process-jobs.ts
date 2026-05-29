/**
 * Background worker — polls queued jobs and runs Blender pipeline.
 * Run: npm run worker
 */
import { createClient } from '@supabase/supabase-js'
import { processListingJob } from '../lib/processing'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
)

const POLL_MS = 5000

async function poll() {
  const { data: jobs } = await supabase
    .from('processing_jobs')
    .select('listing_id')
    .eq('status', 'queued')
    .limit(1)

  if (jobs?.[0]) {
    console.log('Processing', jobs[0].listing_id)
    await processListingJob(jobs[0].listing_id)
  }
}

console.log('FurnishAR worker started')
setInterval(() => {
  void poll().catch(console.error)
}, POLL_MS)
void poll()
