import type { Metadata } from 'next'
import Script from 'next/script'
import { Suspense } from 'react'
import { SiteHeader } from '@/components/SiteHeader'
import { PendoInitializer } from '@/components/PendoInitializer'
import { PendoPageTracker } from '@/components/PendoPageTracker'
import './globals.css'

export const metadata: Metadata = {
  title: 'Atelier — AR Furniture Showroom',
  description:
    'Curated furniture with gallery-grade 3D previews. Place pieces in your room with in-browser AR — no app required.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <Script id="pendo-install" strategy="beforeInteractive">{`
          (function(apiKey){
            (function(p,e,n,d,o){var v,w,x,y,z;o=p[d]=p[d]||{};o._q=o._q||[];
            v=['initialize','identify','updateOptions','pageLoad','track','trackAgent'];for(w=0,x=v.length;w<x;++w)(function(m){
            o[m]=o[m]||function(){o._q[m===v[0]?'unshift':'push']([m].concat([].slice.call(arguments,0)));};})(v[w]);
            y=e.createElement(n);y.async=!0;y.src='https://cdn.pendo.io/agent/static/'+apiKey+'/pendo.js';
            z=e.getElementsByTagName(n)[0];z.parentNode.insertBefore(y,z);})(window,document,'script','pendo');
          })('4fe71006-306d-4ca4-acd4-a4a7cff34280');
        `}</Script>
      </head>
      <body>
        <PendoInitializer />
        <Suspense fallback={null}>
          <PendoPageTracker />
        </Suspense>
        <SiteHeader />
        {children}
      </body>
    </html>
  )
}
