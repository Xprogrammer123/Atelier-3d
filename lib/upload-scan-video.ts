import { scanVideoFileExtension } from '@/lib/scan-recording'

const STALL_TIMEOUT_MS = 45_000
const MAX_UPLOAD_MS = 10 * 60 * 1000

export async function uploadScanVideo(
  listingId: string,
  blob: Blob,
  onProgress?: (percent: number) => void
): Promise<void> {
  const ext = scanVideoFileExtension(blob.type || 'video/webm')
  const formData = new FormData()
  formData.append('video', blob, `scan.${ext}`)

  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('POST', `/api/listings/${listingId}/scan-video`)
    xhr.timeout = MAX_UPLOAD_MS

    let lastProgressAt = Date.now()
    let lastPercent = 0

    const stallTimer = window.setInterval(() => {
      if (Date.now() - lastProgressAt > STALL_TIMEOUT_MS) {
        window.clearInterval(stallTimer)
        xhr.abort()
        reject(
          new Error(
            'Upload stalled — no progress for 45 seconds. Refresh, re-record a shorter scan, and try again.'
          )
        )
      }
    }, 5000)

    xhr.upload.onprogress = (event) => {
      lastProgressAt = Date.now()
      if (!event.lengthComputable) {
        onProgress?.(Math.min(lastPercent + 2, 95))
        return
      }
      lastPercent = Math.round((event.loaded / event.total) * 100)
      onProgress?.(lastPercent)
    }

    xhr.onload = () => {
      window.clearInterval(stallTimer)

      if (xhr.status >= 200 && xhr.status < 300) {
        onProgress?.(100)
        resolve()
        return
      }

      try {
        const body = JSON.parse(xhr.responseText) as { error?: string }
        reject(new Error(body.error ?? `Upload failed (HTTP ${xhr.status})`))
      } catch {
        reject(new Error(`Upload failed (HTTP ${xhr.status})`))
      }
    }

    xhr.onerror = () => {
      window.clearInterval(stallTimer)
      reject(new Error('Upload failed — could not reach the server. Is the dev server running?'))
    }

    xhr.ontimeout = () => {
      window.clearInterval(stallTimer)
      reject(new Error('Upload timed out. Try a shorter scan recording (10–20 seconds).'))
    }

    onProgress?.(1)
    xhr.send(formData)
  })
}
