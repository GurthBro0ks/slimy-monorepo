"use strict";

const { randomUUID } = require("crypto");

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  generateBuildId: async () => {
    if (process.env.NEXT_BUILD_ID) {
      return process.env.NEXT_BUILD_ID;
    }
    const timestamp = Date.now().toString(36);
    const entropy = randomUUID().replace(/-/g, "").slice(0, 12);
    return `slimy-${timestamp}-${entropy}`;
  },
  env: {
    // Use empty string in production for relative paths (Next.js rewrites proxy to backend)
    NEXT_PUBLIC_ADMIN_API_BASE:
      process.env.NEXT_PUBLIC_ADMIN_API_BASE !== undefined
        ? process.env.NEXT_PUBLIC_ADMIN_API_BASE
        : '',
  },
  async rewrites() {
    const backendUrl = process.env.ADMIN_API_INTERNAL_URL || 'http://localhost:3080';
    return {
      afterFiles: [
        // Auth proxy - proxies /auth/* to backend (runs after filesystem check so local routes work)
        {
          source: '/auth/:path*',
          destination: `${backendUrl}/auth/:path*`,
        },
      ],
      // Important: keep the broad /api proxy as a fallback so dynamic local API routes
      // (like /api/admin-api/[...path]) can take precedence.
      fallback: [
        {
          source: '/api/:path*',
          destination: `${backendUrl}/api/:path*`,
        },
      ],
    };
  },
};

module.exports = nextConfig;
