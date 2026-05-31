'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { MAX_SCAN_SECONDS } from '@/lib/types'
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

  const [cameraReady, setCameraReady] = useState(false)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [recording, setRecording] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [hasRecording, setHasRecording] = useState(false)

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
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: 'environment' },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        })
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop())
          return
        }
        streamRef.current = stream
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          await videoRef.current.play()
        }
        setCameraReady(true)
      } catch {
        setCameraError('Camera access is required to scan. Allow camera permission and use HTTPS on mobile.')
      }
    }

    void startCamera()
    return () => {
      cancelled = true
      stopCamera()
    }
  }, [stopCamera])

  useEffect(() => {
    if (!recording) return
    const timer = window.setInterval(() => {
      setElapsed((e) => {
        if (e + 1 >= MAX_SCAN_SECONDS) {
          recorderRef.current?.stop()
        }
        return e + 1
      })
    }, 1000)
    return () => window.clearInterval(timer)
  }, [recording])

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    }
  }, [previewUrl])

  function clearRecording() {
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setPreviewUrl(null)
    setHasRecording(false)
    setElapsed(0)
    onRecordingReady(null)
  }

  function startRecording() {
    if (!streamRef.current || disabled) return
    chunksRef.current = []
    clearRecording()

    const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
      ? 'video/webm;codecs=vp9'
      : MediaRecorder.isTypeSupported('video/webm')
        ? 'video/webm'
        : ''

    const recorder = new MediaRecorder(streamRef.current, mimeType ? { mimeType } : undefined)
    recorderRef.current = recorder

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data)
    }

    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: recorder.mimeType || 'video/webm' })
      const url = URL.createObjectURL(blob)
      setPreviewUrl(url)
      setHasRecording(true)
      onRecordingReady(blob)
      setRecording(false)
      stopCamera()
    }

    recorder.start(250)
    setRecording(true)
    setElapsed(0)
  }

  function stopRecording() {
    if (recorderRef.current?.state === 'recording') {
      recorderRef.current.stop()
    }
  }

  return (
    <div className="grid gap-4">
      <div className="relative aspect-[4/3] rounded-md overflow-hidden bg-black border border-line">
        {previewUrl ? (
          <video src={previewUrl} className="w-full h-full object-cover" controls playsInline />
        ) : (
          <video
            ref={videoRef}
            className={cn('w-full h-full object-cover', !cameraReady && 'opacity-0')}
            playsInline
            muted
          />
        )}

        {!cameraReady && !previewUrl && !cameraError && (
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

        {hasRecording && (
          <div className="absolute top-3 right-3 size-8 grid place-items-center bg-accent-sage text-white rounded-full text-sm font-bold">
            ✓
          </div>
        )}
      </div>

      <p className="m-0 text-[0.88rem] text-ink-muted">
        Walk slowly around your piece for up to {MAX_SCAN_SECONDS} seconds. Keep the full item in frame with even
        lighting.
      </p>

      <div className="flex flex-wrap items-center gap-3">
        {!hasRecording ? (
          <button
            type="button"
            disabled={disabled || !cameraReady || recording}
            onClick={() => (recording ? stopRecording() : startRecording())}
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
            onClick={clearRecording}
            className="px-4 py-2 text-sm font-semibold border border-line rounded-md bg-surface-paper hover:border-accent-clay-soft"
          >
            Re-scan
          </button>
        )}
        <span className="text-[0.85rem] text-ink-soft">
          {hasRecording
            ? 'Scan ready — publish to upload and build your 3D model'
            : recording
              ? 'Tap the button again to finish'
              : 'Tap the white button to start scanning'}
        </span>
      </div>
    </div>
  )
}
