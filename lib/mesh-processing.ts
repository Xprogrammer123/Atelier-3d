import { spawn } from 'child_process'
import fs from 'fs/promises'
import path from 'path'
import { loadEnv } from '@/lib/load-env'
import { createNodeSupabaseClient } from '@/lib/supabase/node-client'
import {
  cleanupWorkDir,
  failListingJob,
  finalizeListingFromGlb,
  glbExistsInStorage,
} from '@/lib/finalize-listing'
import { downloadListingScanVideo } from '@/lib/scan-storage'

function getServiceClient() {
  loadEnv()
  return createNodeSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function processScanMeshJob(listingId: string): Promise<void> {
  const supabase = getServiceClient()

  const { data: job } = await supabase
    .from('processing_jobs')
    .select('*')
    .eq('listing_id', listingId)
    .single()

  if (!job || job.status === 'generating' || job.status === 'complete') return
  if (job.job_type !== 'scan') return

  const startedAt = new Date().toISOString()

  await supabase
    .from('processing_jobs')
    .update({ status: 'generating', started_at: startedAt, error_message: null })
    .eq('listing_id', listingId)

  const workDir = path.join('/tmp', 'atelier', listingId, 'mesh')
  await fs.mkdir(workDir, { recursive: true })

  try {
    const downloaded = await downloadListingScanVideo(supabase, listingId)
    if (!downloaded) {
      throw new Error('Scan video not found. Re-record and upload from the listing page.')
    }

    const ext = downloaded.storagePath.endsWith('.mp4') ? 'mp4' : 'webm'
    const localVideo = path.join(workDir, `scan.${ext}`)
    await fs.writeFile(localVideo, Buffer.from(await downloaded.blob.arrayBuffer()))

    const scriptPath = path.join(process.cwd(), 'scripts/mesh/process_scan_job.py')
    const python = process.env.MESH_PYTHON ?? process.env.DG_MESH_PYTHON ?? 'python3'

    await runMeshScript(python, scriptPath, listingId, workDir)

    const hasGlb = await glbExistsInStorage(supabase, listingId)
    if (!hasGlb) {
      throw new Error('Mesh worker finished but no GLB was produced')
    }

    await finalizeListingFromGlb(supabase, listingId, { processingStartedAt: startedAt })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Mesh reconstruction failed'
    await failListingJob(supabase, listingId, message)
  } finally {
    await cleanupWorkDir(listingId)
  }
}

function runMeshScript(
  python: string,
  script: string,
  listingId: string,
  workDir: string
): Promise<void> {
  return new Promise((resolve, reject) => {
    const env = {
      ...process.env,
      ATELIER_LISTING_ID: listingId,
      ATELIER_WORK_DIR: workDir,
    }

    const proc = spawn(python, [script, listingId], {
      env,
      cwd: process.cwd(),
    })

    let stderr = ''
    let stdout = ''

    proc.stdout.on('data', (d) => {
      const chunk = d.toString()
      stdout += chunk
      process.stdout.write(`[mesh:${listingId}] ${chunk}`)
    })
    proc.stderr.on('data', (d) => {
      const chunk = d.toString()
      stderr += chunk
      process.stderr.write(`[mesh:${listingId}] ${chunk}`)
    })

    proc.on('close', (code) => {
      if (code === 0) resolve()
      else reject(new Error(stderr.trim() || stdout.trim() || `Mesh script exited with code ${code}`))
    })
    proc.on('error', (e) => reject(e))
  })
}

export async function queueScanMeshJob(listingId: string): Promise<void> {
  void processScanMeshJob(listingId).catch(console.error)
}
