/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb'
    }
  },
  // Mark server-only packages
  serverExternalPackages: ['better-sqlite3']
}

module.exports = nextConfig
