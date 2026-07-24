import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  serverExternalPackages: ['@prisma/client', 'bcryptjs'],
  // Ensure driver adapter packages are included in the standalone build
  // since Next.js can't statically trace them from the dynamic PrismaClient setup
  outputFileTracingIncludes: {
    '**': [
      './node_modules/@prisma/adapter-pg/**',
      './node_modules/pg/**',
      './node_modules/pg-pool/**',
      './node_modules/.prisma/client/**',
      './node_modules/@prisma/client/**',
    ],
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.amazonaws.com' },
      { protocol: 'https', hostname: '**.r2.cloudflarestorage.com' },
      { protocol: 'https', hostname: '**.cloudflare.com' },
    ],
  },
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
      },
    ]
  },
  output: 'standalone',
}

export default nextConfig
