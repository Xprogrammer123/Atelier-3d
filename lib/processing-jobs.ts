import type { SupabaseClient } from '@supabase/supabase-js'
import type { JobStatus, JobType } from '@/lib/types'

type JobRow = {
  status: JobStatus
  job_type: JobType | null
}

export async function insertScanProcessingJob(
  supabase: SupabaseClient,
  listingId: string
): Promise<{ error: string | null }> {
  const { error } = await supabase.from('processing_jobs').insert({
    listing_id: listingId,
    status: 'queued',
    job_type: 'scan',
  })

  if (!error) return { error: null }

  if (error.message.includes('job_type') || error.code === '42703') {
    const { error: legacyError } = await supabase.from('processing_jobs').insert({
      listing_id: listingId,
      status: 'queued',
    })
    if (legacyError) {
      return {
        error:
          'Could not create processing job. Run supabase/migrations/003_scan_pipeline.sql in the Supabase SQL editor.',
      }
    }
    return { error: null }
  }

  return { error: error.message }
}

export async function ensureScanProcessingJob(
  supabase: SupabaseClient,
  listingId: string
): Promise<{ job: JobRow | null; error: string | null }> {
  const { data: existing, error: readError } = await supabase
    .from('processing_jobs')
    .select('status, job_type')
    .eq('listing_id', listingId)
    .maybeSingle()

  if (readError) {
    return { job: null, error: readError.message }
  }

  if (existing) {
    return { job: existing as JobRow, error: null }
  }

  const { error: insertError } = await insertScanProcessingJob(supabase, listingId)
  if (insertError) {
    return { job: null, error: insertError }
  }

  const { data: created, error: reloadError } = await supabase
    .from('processing_jobs')
    .select('status, job_type')
    .eq('listing_id', listingId)
    .single()

  if (reloadError || !created) {
    return { job: null, error: reloadError?.message ?? 'Processing job could not be loaded' }
  }

  return { job: created as JobRow, error: null }
}

export function isScanJob(job: JobRow): boolean {
  return job.job_type === 'scan' || job.job_type == null
}
