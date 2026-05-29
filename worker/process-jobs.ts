/**
 * Background worker — polls queued jobs and runs Blender pipeline.
 * Run: npm run worker
 */
import { loadEnv, requireEnv } from '../lib/load-env'

loadEnv()

import { createNodeSupabaseClient } from '../lib/supabase/node-client'
import { processListingJob } from '../lib/processing'

const supabaseUrl = requireEnv('NEXT_PUBLIC_SUPABASE_URL')
const serviceRoleKey = requireEnv('SUPABASE_SERVICE_ROLE_KEY')

const supabase = createNodeSupabaseClient(supabaseUrl, serviceRoleKey)

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

console.log('Atelier worker started')
setInterval(() => {
  void poll().catch(console.error)
}, POLL_MS)
void poll()
