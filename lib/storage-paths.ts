export const LISTINGS_BUCKET = 'listings'

export function listingGlbPath(listingId: string): string {
  return `${listingId}/model.glb`
}

export function listingQrPath(listingId: string): string {
  return `${listingId}/qr.png`
}

export function listingScanVideoPath(listingId: string, ext: 'webm' | 'mp4' = 'webm'): string {
  return `${listingId}/scan/video.${ext}`
}

export function listingScanVideoPaths(listingId: string): string[] {
  return [listingScanVideoPath(listingId, 'webm'), listingScanVideoPath(listingId, 'mp4')]
}

export function listingPhotoPath(listingId: string, label: string): string {
  return `${listingId}/photos/${label}.jpg`
}
