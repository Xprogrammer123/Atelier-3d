import { spawn } from 'child_process'
import fs from 'fs/promises'
import path from 'path'
import { loadEnv } from '@/lib/load-env'
import { createNodeSupabaseClient } from '@/lib/supabase/node-client'

function getServiceClient() {
  loadEnv()
  return createNodeSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}
import { generateQrBuffer } from '@/lib/qr'
import { pendoTrackServer } from '@/lib/pendo-server'
import { getArUrl } from '@/lib/types'

const BUCKET = 'listings'

export async function processListingJob(listingId: string): Promise<void> {
  const supabase = getServiceClient()

  const { data: job } = await supabase
    .from('processing_jobs')
    .select('*')
    .eq('listing_id', listingId)
    .single()

  if (!job || job.status === 'generating' || job.status === 'complete') return

  await supabase
    .from('processing_jobs')
    .update({ status: 'generating', started_at: new Date().toISOString() })
    .eq('listing_id', listingId)

  const workDir = path.join('/tmp', 'atelier', listingId)
  await fs.mkdir(workDir, { recursive: true })

  try {
    const { data: listing } = await supabase
      .from('listings')
      .select('width_cm, depth_cm, height_cm, category')
      .eq('id', listingId)
      .single()

    const { data: photos } = await supabase
      .from('listing_photos')
      .select('*')
      .eq('listing_id', listingId)

    const glbPath = `${listingId}/model.glb`
    const { data: existingGlb, error: existingGlbError } = await supabase.storage
      .from(BUCKET)
      .download(glbPath)

    let glbUrl: string

    if (!existingGlbError && existingGlb) {
      const { data: glbPublic } = supabase.storage.from(BUCKET).getPublicUrl(glbPath)
      glbUrl = `${glbPublic.publicUrl}?v=${Date.now()}`
    } else {
      if (!photos || photos.length < 4) {
        throw new Error('Upload a GLB scan or provide four photos for generation')
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
      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(glbPath, glbBody, { contentType: 'model/gltf-binary', upsert: true })

      if (uploadError) throw uploadError

      const { data: glbPublic } = supabase.storage.from(BUCKET).getPublicUrl(glbPath)
      glbUrl = `${glbPublic.publicUrl}?v=${Date.now()}`
    }
    const front = photos?.find((p) => p.label === 'front')
    const posterUrl = front?.public_url ?? null

    const arUrl = getArUrl(listingId)
    const qrBuffer = await generateQrBuffer(arUrl)
    const qrPath = `${listingId}/qr.png`
    await supabase.storage.from(BUCKET).upload(qrPath, qrBuffer, {
      contentType: 'image/png',
      upsert: true,
    })

    await supabase
      .from('listings')
      .update({
        status: 'live',
        glb_url: glbUrl,
        poster_url: posterUrl,
        qr_path: qrPath,
      })
      .eq('id', listingId)

    await supabase
      .from('processing_jobs')
      .update({
        status: 'complete',
        completed_at: new Date().toISOString(),
        error_message: null,
      })
      .eq('listing_id', listingId)

    const durationMs = job.started_at
      ? Date.now() - new Date(job.started_at as string).getTime()
      : undefined
    await pendoTrackServer('model_generation_completed', {
      properties: {
        listing_id: listingId,
        processing_duration_ms: durationMs,
        glb_url: glbUrl,
      },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    await supabase
      .from('processing_jobs')
      .update({ status: 'failed', error_message: message })
      .eq('listing_id', listingId)
    await supabase.from('listings').update({ status: 'failed' }).eq('id', listingId)

    await pendoTrackServer('model_generation_failed', {
      properties: {
        listing_id: listingId,
        error_message: message.substring(0, 200),
      },
    })
  } finally {
    await fs.rm(workDir, { recursive: true, force: true }).catch(() => {})
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
