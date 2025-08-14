/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: "standalone",
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "1b0b50bfd75bc09853d30c816c711b08.r2.cloudflarestorage.com",
        pathname: "/redrawn-ai-albums/**",
      },
    ],
  },
  async rewrites() {
    const apiTarget = process.env.API_PROXY_TARGET || "http://localhost:8080";
    return [
      // Keep Next.js API route under /api/server/*
      {
        source: "/api/server/:path*",
        destination: "/api/server/:path*",
      },
      // Proxy all other /api/* to Go API
      {
        source: "/api/:path*",
        destination: `${apiTarget}/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
