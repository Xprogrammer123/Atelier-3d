export const LISTINGS_BUCKET = 'listings'

export function listingGlbPath(listingId: string): string {
  return `${listingId}/model.glb`
}

export function listingQrPath(listingId: string): string {
  return `${listingId}/qr.png`
}

export function listingScanVideoPath(listingId: string): string {
  return `${listingId}/scan/video.webm`
}

export function listingPhotoPath(listingId: string, label: string): string {
  return `${listingId}/photos/${label}.jpg`
}
