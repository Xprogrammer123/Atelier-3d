import type { DetailedHTMLProps, HTMLAttributes } from 'react'

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'model-viewer': DetailedHTMLProps<
        HTMLAttributes<HTMLElement> & {
          src?: string
          alt?: string
          ar?: boolean
          'ar-modes'?: string
          'ar-placement'?: string
          'ar-scale'?: string
          'camera-controls'?: boolean
          'auto-rotate'?: boolean
          'touch-action'?: string
          'shadow-intensity'?: string
          exposure?: string
          'camera-orbit'?: string
          'disable-zoom'?: boolean
          'interaction-prompt'?: string
          poster?: string
          loading?: 'auto' | 'lazy' | 'eager'
          scale?: string
        },
        HTMLElement
      >
    }
  }
}

export type ModelViewerElement = HTMLElement & {
  activateAR: () => Promise<void>
  exitAR?: () => void
}
