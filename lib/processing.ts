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
import { LISTINGS_BUCKET, listingGlbPath } from '@/lib/storage-paths'

function getServiceClient() {
  loadEnv()
  return createNodeSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function processListingJob(listingId: string): Promise<void> {
  const supabase = getServiceClient()

  const { data: job } = await supabase
    .from('processing_jobs')
    .select('*')
    .eq('listing_id', listingId)
    .single()

  if (!job || job.status === 'generating' || job.status === 'complete') return

  const jobType = (job.job_type as string | null) ?? 'photos'
  if (jobType === 'scan') return

  const startedAt = new Date().toISOString()

  await supabase
    .from('processing_jobs')
    .update({ status: 'generating', started_at: startedAt, error_message: null })
    .eq('listing_id', listingId)

  const workDir = path.join('/tmp', 'atelier', listingId)
  await fs.mkdir(workDir, { recursive: true })

  try {
    if (await glbExistsInStorage(supabase, listingId)) {
      await finalizeListingFromGlb(supabase, listingId, { processingStartedAt: startedAt })
      return
    }

    if (jobType === 'upload') {
      throw new Error('3D model file missing. Upload a GLB and try again.')
    }

    const { data: listing } = await supabase
      .from('listings')
      .select('width_cm, depth_cm, height_cm, category')
      .eq('id', listingId)
      .single()

    const { data: photos } = await supabase
      .from('listing_photos')
      .select('*')
      .eq('listing_id', listingId)

    if (!photos || photos.length < 4) {
      throw new Error('Four photos required for Blender generation')
    }

    for (const photo of photos) {
      const res = await fetch(photo.public_url)
      if (!res.ok) {
        throw new Error(`Failed to download ${photo.label} photo (${res.status})`)
      }
      const buf = Buffer.from(await res.arrayBuffer())
      await fs.writeFile(path.join(workDir, `${photo.label}.jpg`), buf)
    }

    const widthM = ((listing?.width_cm as number | null) ?? 100) / 100
    const depthM = ((listing?.depth_cm as number | null) ?? 60) / 100
    const heightM = ((listing?.height_cm as number | null) ?? 80) / 100
    const category = (listing?.category as string | null) ?? 'Surfaces'

    const outGlb = path.join(workDir, 'model.glb')
    const scriptPath = path.join(process.cwd(), 'scripts/blender/generate.py')
    const blender = process.env.BLENDER_PATH ?? 'blender'

    await runBlender(blender, scriptPath, workDir, outGlb, widthM, depthM, heightM, category)

    const glbBody = await fs.readFile(outGlb)
    const glbPath = listingGlbPath(listingId)
    const { error: uploadError } = await supabase.storage
      .from(LISTINGS_BUCKET)
      .upload(glbPath, glbBody, { contentType: 'model/gltf-binary', upsert: true })

    if (uploadError) throw uploadError

    await finalizeListingFromGlb(supabase, listingId, { processingStartedAt: startedAt })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    await failListingJob(supabase, listingId, message)
  } finally {
    await cleanupWorkDir(listingId)
  }
}

function runBlender(
  blender: string,
  script: string,
  workDir: string,
  output: string,
  widthM: number,
  depthM: number,
  heightM: number,
  category: string
): Promise<void> {
  return new Promise((resolve, reject) => {
    const proc = spawn(blender, [
      '--background',
      '--python',
      script,
      '--',
      workDir,
      output,
      String(widthM),
      String(depthM),
      String(heightM),
      category,
    ])

    let stderr = ''
    proc.stderr.on('data', (d) => {
      stderr += d.toString()
    })
    proc.on('close', (code) => {
      if (code === 0) resolve()
      else reject(new Error(stderr || `Blender exited with code ${code}`))
    })
    proc.on('error', (e) => reject(e))
  })
}

export async function queueListingJob(listingId: string): Promise<void> {
  void processListingJob(listingId).catch(console.error)
}
