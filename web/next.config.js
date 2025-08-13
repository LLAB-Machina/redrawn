/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  async rewrites() {
    const apiTarget = process.env.API_PROXY_TARGET || 'http://localhost:8080';
    return [
      // Keep Next.js API route under /api/server/*
      {
        source: '/api/server/:path*',
        destination: '/api/server/:path*',
      },
      // Proxy all other /api/* to Go API
      {
        source: '/api/:path*',
        destination: `${apiTarget}/:path*`,
      },
    ];
  },
}

module.exports = nextConfig

