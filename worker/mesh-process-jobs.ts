/**
 * Polls scan jobs and runs the DG-Mesh pipeline.
 * Run: npm run worker
 */
import { loadEnv, requireEnv } from '../lib/load-env'

loadEnv()

import { createNodeSupabaseClient } from '../lib/supabase/node-client'
import { processScanMeshJob } from '../lib/mesh-processing'

const supabaseUrl = requireEnv('NEXT_PUBLIC_SUPABASE_URL')
const serviceRoleKey = requireEnv('SUPABASE_SERVICE_ROLE_KEY')

const supabase = createNodeSupabaseClient(supabaseUrl, serviceRoleKey)

const POLL_MS = 8000

async function poll() {
  const { data: jobs } = await supabase
    .from('processing_jobs')
    .select('listing_id')
    .eq('job_type', 'scan')
    .eq('status', 'queued')
    .limit(1)

  if (jobs?.[0]) {
    console.log('Mesh processing', jobs[0].listing_id)
    await processScanMeshJob(jobs[0].listing_id)
  }
}

console.log('Atelier mesh worker started')
setInterval(() => {
  void poll().catch(console.error)
}, POLL_MS)
void poll()
