import type { NextConfig } from 'next'

// next-pwa is a CommonJS package — require() is available at runtime via @types/node
// Disabled in development to prevent service-worker caching from interfering with HMR
// eslint-disable-next-line @typescript-eslint/no-require-imports
const withPWA = (require('next-pwa') as (opts: object) => (cfg: NextConfig) => NextConfig)({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
})

const nextConfig: NextConfig = {
  turbopack: {}, // Explicitly opt-in to Turbopack (Next.js 16 default) to silence the webpack conflict warning from next-pwa
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'img.youtube.com',
      },
    ],
  },
}

export default withPWA(nextConfig)
