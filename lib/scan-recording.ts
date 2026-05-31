/** Best MediaRecorder mime type for this browser (mp4 on Safari, webm elsewhere). */
export function getScanRecorderMimeType(): string {
  if (typeof MediaRecorder === 'undefined') return ''

  const candidates = [
    'video/webm;codecs=vp8',
    'video/webm;codecs=vp9',
    'video/webm',
    'video/mp4;codecs=avc1,mp4a.0',
    'video/mp4;codecs=avc1',
    'video/mp4',
  ]

  for (const type of candidates) {
    if (MediaRecorder.isTypeSupported(type)) return type
  }

  return ''
}

export function scanVideoFileExtension(mimeType: string): 'webm' | 'mp4' {
  return mimeType.includes('mp4') ? 'mp4' : 'webm'
}
