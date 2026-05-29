import type { Metadata } from 'next'
import { Cormorant_Garamond, Plus_Jakarta_Sans } from 'next/font/google'
import { SiteHeader } from '@/components/SiteHeader'
import './globals.css'

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-body-family',
  display: 'swap',
})

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  variable: '--font-display-family',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'FurnishAR — AR Furniture Ecommerce',
  description:
    'Browse furniture with 3D previews and place items in your room with in-browser AR. No app download required.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${plusJakarta.variable} ${cormorant.variable}`} suppressHydrationWarning>
      <body className={plusJakarta.className}>
        <SiteHeader />
        {children}
      </body>
    </html>
  )
}
