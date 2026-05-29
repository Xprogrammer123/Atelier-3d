import type { Metadata } from 'next'
import { SiteHeader } from '@/components/SiteHeader'
import './globals.css'

export const metadata: Metadata = {
  title: 'FurnishAR — AR Furniture Ecommerce',
  description:
    'Browse furniture with 3D previews and place items in your room with in-browser AR. No app download required.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <script
          type="module"
          src="https://ajax.googleapis.com/ajax/libs/model-viewer/3.4.0/model-viewer.min.js"
          async
        />
      </head>
      <body>
        <SiteHeader />
        {children}
      </body>
    </html>
  )
}
