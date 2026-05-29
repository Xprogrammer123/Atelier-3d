import { spawn } from 'child_process'
import fs from 'fs/promises'
import path from 'path'
import { createServiceClient } from '@/lib/supabase/admin'
import { generateQrBuffer } from '@/lib/qr'
import { getArUrl } from '@/lib/types'

const BUCKET = 'listings'

export async function processListingJob(listingId: string): Promise<void> {
  const supabase = createServiceClient()

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

  const workDir = path.join('/tmp', 'furnishar', listingId)
  await fs.mkdir(workDir, { recursive: true })

  try {
    const { data: photos } = await supabase
      .from('listing_photos')
      .select('*')
      .eq('listing_id', listingId)

    if (!photos || photos.length < 4) {
      throw new Error('Four photos required')
    }

    for (const photo of photos) {
      const res = await fetch(photo.public_url)
      const buf = Buffer.from(await res.arrayBuffer())
      await fs.writeFile(path.join(workDir, `${photo.label}.jpg`), buf)
    }

    const outGlb = path.join(workDir, 'model.glb')
    const scriptPath = path.join(process.cwd(), 'scripts/blender/generate.py')
    const blender = process.env.BLENDER_PATH ?? 'blender'

    await runBlender(blender, scriptPath, workDir, outGlb)

    const glbBody = await fs.readFile(outGlb)
    const glbPath = `${listingId}/model.glb`
    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(glbPath, glbBody, { contentType: 'model/gltf-binary', upsert: true })

    if (uploadError) throw uploadError

    const { data: glbPublic } = supabase.storage.from(BUCKET).getPublicUrl(glbPath)
    const front = photos.find((p) => p.label === 'front')
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
        glb_url: glbPublic.publicUrl,
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
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    await supabase
      .from('processing_jobs')
      .update({ status: 'failed', error_message: message })
      .eq('listing_id', listingId)
    await supabase.from('listings').update({ status: 'failed' }).eq('id', listingId)
  } finally {
    await fs.rm(workDir, { recursive: true, force: true }).catch(() => {})
  }
}

function runBlender(
  blender: string,
  script: string,
  workDir: string,
  output: string
): Promise<void> {
  return new Promise((resolve, reject) => {
    const proc = spawn(blender, [
      '--background',
      '--python',
      script,
      '--',
      workDir,
      output,
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
