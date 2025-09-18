/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Ensure Vercel does not run `next export`; we need a server runtime for API routes and dynamic pages
  output: 'standalone',
}

export default nextConfig
