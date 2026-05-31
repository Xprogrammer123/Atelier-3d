'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { getScanRecorderMimeType, getScanVideoConstraints, isLikelyMobileDevice } from '@/lib/scan-recording'
import { MAX_SCAN_SECONDS, MIN_SCAN_SECONDS } from '@/lib/types'
import { cn } from '@/lib/cn'

type Props = {
  onRecordingReady: (blob: Blob | null) => void
  disabled?: boolean
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

export function ScanCapture({ onRecordingReady, disabled }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const recorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const elapsedRef = useRef(0)
  const previewUrlRef = useRef<string | null>(null)
  const mimeTypeRef = useRef('')

  const [cameraReady, setCameraReady] = useState(false)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [recording, setRecording] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [hasRecording, setHasRecording] = useState(false)
  const [durationError, setDurationError] = useState<string | null>(null)
  const isMobile = isLikelyMobileDevice()

  const revokePreviewUrl = useCallback(() => {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current)
      previewUrlRef.current = null
    }
  }, [])

  const attachLiveStream = useCallback(
    async (stream: MediaStream) => {
      const video = videoRef.current
      if (!video) return

      revokePreviewUrl()
      video.removeAttribute('src')
      video.srcObject = stream
      await video.play()
    },
    [revokePreviewUrl]
  )

  const showRecordedPreview = useCallback(
    async (blob: Blob) => {
      const video = videoRef.current
      if (!video) return

      revokePreviewUrl()
      video.srcObject = null

      const url = URL.createObjectURL(blob)
      previewUrlRef.current = url
      video.src = url
      video.load()

      try {
        await video.play()
      } catch {
        // Controls remain available if autoplay is blocked.
      }
    },
    [revokePreviewUrl]
  )

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
    setCameraReady(false)
  }, [])

  useEffect(() => {
    let cancelled = false

    async function startCamera() {
      setCameraError(null)
      try {
        const stream = await navigator.mediaDevices.getUserMedia(getScanVideoConstraints())
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop())
          return
        }
        streamRef.current = stream
        await attachLiveStream(stream)
        setCameraReady(true)
      } catch {
        setCameraError('Camera access is required to scan. Allow camera permission and use HTTPS on mobile.')
      }
    }

    void startCamera()
    return () => {
      cancelled = true
      stopCamera()
      revokePreviewUrl()
    }
  }, [attachLiveStream, revokePreviewUrl, stopCamera])

  useEffect(() => {
    if (!recording) return
    const timer = window.setInterval(() => {
      const next = elapsedRef.current + 1
      elapsedRef.current = next
      setElapsed(next)
      if (next >= MAX_SCAN_SECONDS) {
        stopRecordingInternal()
      }
    }, 1000)
    return () => window.clearInterval(timer)
  }, [recording])

  function clearRecording() {
    revokePreviewUrl()
    setHasRecording(false)
    setElapsed(0)
    elapsedRef.current = 0
    setDurationError(null)
    onRecordingReady(null)

    const video = videoRef.current
    if (video) {
      video.removeAttribute('src')
      video.srcObject = null
    }
  }

  async function restartCameraAfterPreview() {
    clearRecording()
    setCameraError(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia(getScanVideoConstraints())
      streamRef.current = stream
      await attachLiveStream(stream)
      setCameraReady(true)
    } catch {
      setCameraError('Camera access is required to scan. Allow camera permission and use HTTPS on mobile.')
    }
  }

  function stopRecordingInternal() {
    const recorder = recorderRef.current
    if (!recorder || recorder.state !== 'recording') return

    if (elapsedRef.current < MIN_SCAN_SECONDS) {
      const remaining = MIN_SCAN_SECONDS - elapsedRef.current
      setDurationError(`Keep recording — ${remaining} more second${remaining === 1 ? '' : 's'} needed.`)
      return
    }

    setDurationError(null)
    recorder.requestData()
    recorder.stop()
  }

  function startRecording() {
    if (!streamRef.current || disabled) return

    chunksRef.current = []
    revokePreviewUrl()
    setHasRecording(false)
    setElapsed(0)
    elapsedRef.current = 0
    setDurationError(null)
    onRecordingReady(null)

    const video = videoRef.current
    if (video) {
      video.removeAttribute('src')
      video.srcObject = streamRef.current
    }

    const mimeType = getScanRecorderMimeType()
    mimeTypeRef.current = mimeType

    const recorder = new MediaRecorder(streamRef.current, mimeType ? { mimeType } : undefined)
    recorderRef.current = recorder

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data)
    }

    recorder.onstop = () => {
      void (async () => {
        const recordedSeconds = elapsedRef.current
        const blobType = mimeTypeRef.current || recorder.mimeType || 'video/webm'
        const blob = new Blob(chunksRef.current, { type: blobType })

        setRecording(false)

        if (recordedSeconds < MIN_SCAN_SECONDS) {
          setDurationError(
            `Scan too short — record at least ${MIN_SCAN_SECONDS} seconds (you recorded ${recordedSeconds}s).`
          )
          setElapsed(0)
          elapsedRef.current = 0
          onRecordingReady(null)
          return
        }

        if (blob.size < 1024) {
          setDurationError('Recording failed — no video data captured. Try again.')
          setElapsed(0)
          elapsedRef.current = 0
          onRecordingReady(null)
          return
        }

        stopCamera()
        await showRecordedPreview(blob)
        setHasRecording(true)
        onRecordingReady(blob)
      })()
    }

    recorder.start(1000)
    setRecording(true)
  }

  async function handleReScan() {
    await restartCameraAfterPreview()
  }

  const secondsUntilMinimum = Math.max(0, MIN_SCAN_SECONDS - elapsed)
  const showLiveFeed = !hasRecording

  return (
    <div className="grid gap-4">
      <div className="relative aspect-[4/3] rounded-md overflow-hidden bg-black border border-line">
        <video
          ref={videoRef}
          className={cn('w-full h-full object-cover', showLiveFeed && !cameraReady && 'opacity-0')}
          playsInline
          muted={showLiveFeed}
          controls={hasRecording}
          preload={hasRecording ? 'auto' : undefined}
        />

        {showLiveFeed && !cameraReady && !cameraError && (
          <div className="absolute inset-0 grid place-items-center text-white/80 text-sm">
            Starting camera…
          </div>
        )}

        {cameraError && (
          <div className="absolute inset-0 grid place-items-center p-4 text-center text-[#fde8e4] text-sm">
            {cameraError}
          </div>
        )}

        {recording && (
          <div className="absolute top-3 left-3 px-2 py-1 rounded-sm bg-[#c0392b] text-white text-xs font-bold tracking-wider">
            REC {formatDuration(elapsed)}
          </div>
        )}

        {recording && secondsUntilMinimum > 0 && (
          <div className="absolute bottom-3 left-3 right-3 px-3 py-2 rounded-sm bg-black/70 text-white text-xs text-center">
            Minimum {MIN_SCAN_SECONDS}s — {secondsUntilMinimum}s remaining
          </div>
        )}

        {hasRecording && (
          <div className="absolute top-3 right-3 size-8 grid place-items-center bg-accent-sage text-white rounded-full text-sm font-bold pointer-events-none">
            ✓
          </div>
        )}
      </div>

      <p className="m-0 text-[0.88rem] text-ink-muted">
        Walk slowly around your piece for at least {MIN_SCAN_SECONDS} seconds (up to {MAX_SCAN_SECONDS} seconds).
        Keep the full item in frame with even lighting.
      </p>

      {!isMobile && (
        <p className="m-0 text-[0.85rem] text-ink-soft">
          On a laptop, the webcam works for testing — for real listings, use a phone and walk around the piece with
          the back camera.
        </p>
      )}

      {durationError && (
        <p className="m-0 text-[0.85rem] text-[#8b2e1f]" role="alert">
          {durationError}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-3">
        {!hasRecording ? (
          <button
            type="button"
            disabled={disabled || !cameraReady}
            onClick={() => (recording ? stopRecordingInternal() : startRecording())}
            className={cn(
              'size-16 rounded-full border-4 border-white shadow-[0_0_0_3px_var(--color-ink-strong)] transition-transform',
              recording ? 'bg-[#c0392b] scale-95' : 'bg-white hover:scale-105',
              (disabled || !cameraReady) && 'opacity-40 cursor-not-allowed hover:scale-100'
            )}
            aria-label={recording ? 'Stop scan' : 'Start scan'}
          />
        ) : (
          <button
            type="button"
            disabled={disabled}
            onClick={() => void handleReScan()}
            className="px-4 py-2 text-sm font-semibold border border-line rounded-md bg-surface-paper hover:border-accent-clay-soft"
          >
            Re-scan
          </button>
        )}
        <span className="text-[0.85rem] text-ink-soft">
          {hasRecording
            ? 'Review your scan above, then publish when ready'
            : recording
              ? secondsUntilMinimum > 0
                ? `Recording… tap the red button after ${MIN_SCAN_SECONDS}s to finish`
                : 'Tap the red button to finish your scan'
              : 'Tap the white button to start scanning'}
        </span>
      </div>
    </div>
  )
}
