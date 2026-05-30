import type { NextConfig } from 'next'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const nextConfig: NextConfig = {
  // Prevent Next from picking wrong workspace root (parent package-lock.json)
  outputFileTracingRoot: path.join(__dirname),

  eslint: {
    ignoreDuringBuilds: true,
  },

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
    ],
  },
}

export default nextConfig
