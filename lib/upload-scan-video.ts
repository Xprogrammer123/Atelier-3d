import * as tus from 'tus-js-client'
import { createClient } from '@/lib/supabase/client'
import { LISTINGS_BUCKET, listingScanVideoPath } from '@/lib/storage-paths'
import { scanVideoFileExtension } from '@/lib/scan-recording'

const TUS_THRESHOLD_BYTES = 6 * 1024 * 1024
const UPLOAD_TIMEOUT_MS = 3 * 60 * 1000

function getSupabaseProjectRef(): string {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!url) throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL')
  return new URL(url).hostname.split('.')[0]!
}

function getResumableEndpoint(): string {
  return `https://${getSupabaseProjectRef()}.storage.supabase.co/storage/v1/upload/resumable`
}

async function getAccessToken(): Promise<string> {
  const supabase = createClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session?.access_token) {
    throw new Error('You must be signed in to upload your scan.')
  }
  return session.access_token
}

function uploadWithTimeout<T>(promise: Promise<T>, label: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = window.setTimeout(() => {
      reject(new Error(`${label} timed out after ${Math.round(UPLOAD_TIMEOUT_MS / 1000)}s. Check your connection and try again.`))
    }, UPLOAD_TIMEOUT_MS)

    promise
      .then((value) => {
        window.clearTimeout(timer)
        resolve(value)
      })
      .catch((err) => {
        window.clearTimeout(timer)
        reject(err)
      })
  })
}

async function uploadStandard(
  listingId: string,
  blob: Blob,
  onProgress?: (percent: number) => void
): Promise<void> {
  const supabase = createClient()
  const ext = scanVideoFileExtension(blob.type || 'video/webm')
  const path = listingScanVideoPath(listingId, ext)
  const contentType = blob.type || (ext === 'mp4' ? 'video/mp4' : 'video/webm')

  onProgress?.(5)

  const { error } = await supabase.storage.from(LISTINGS_BUCKET).upload(path, blob, {
    contentType,
    upsert: true,
  })

  if (error) throw new Error(error.message)
  onProgress?.(100)
}

async function uploadResumable(
  listingId: string,
  blob: Blob,
  onProgress?: (percent: number) => void
): Promise<void> {
  const accessToken = await getAccessToken()
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!anonKey) throw new Error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY')

  const ext = scanVideoFileExtension(blob.type || 'video/webm')
  const path = listingScanVideoPath(listingId, ext)
  const contentType = blob.type || (ext === 'mp4' ? 'video/mp4' : 'video/webm')
  const file = new File([blob], `scan.${ext}`, { type: contentType })

  await new Promise<void>((resolve, reject) => {
    const upload = new tus.Upload(file, {
      endpoint: getResumableEndpoint(),
      retryDelays: [0, 1000, 3000, 5000],
      chunkSize: 6 * 1024 * 1024,
      uploadDataDuringCreation: true,
      removeFingerprintOnSuccess: true,
      headers: {
        authorization: `Bearer ${accessToken}`,
        apikey: anonKey,
        'x-upsert': 'true',
      },
      metadata: {
        bucketName: LISTINGS_BUCKET,
        objectName: path,
        contentType,
        cacheControl: '3600',
      },
      onError: (error) => reject(error),
      onProgress: (bytesUploaded, bytesTotal) => {
        if (bytesTotal <= 0) return
        onProgress?.(Math.min(99, Math.round((bytesUploaded / bytesTotal) * 100)))
      },
      onSuccess: () => {
        onProgress?.(100)
        resolve()
      },
    })

    void upload.findPreviousUploads().then((previous) => {
      if (previous.length > 0) {
        upload.resumeFromPreviousUpload(previous[0]!)
      }
      upload.start()
    })
  })
}

export async function uploadScanVideo(
  listingId: string,
  blob: Blob,
  onProgress?: (percent: number) => void
): Promise<void> {
  const upload =
    blob.size > TUS_THRESHOLD_BYTES
      ? uploadResumable(listingId, blob, onProgress)
      : uploadStandard(listingId, blob, onProgress)

  await uploadWithTimeout(upload, 'Scan upload')
}
