/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  images: {
    domains: ['slimyai.xyz', 'www.slimyai.xyz', 'localhost', '127.0.0.1'],
  },
  async rewrites() {
    const backendUrl = process.env.ADMIN_API_INTERNAL_URL || 'http://localhost:3080';
    return {
      beforeFiles: [
        // API proxy - proxies /api/* to backend (runs before filesystem check)
        {
          source: '/api/:path*',
          destination: `${backendUrl}/api/:path*`,
        },
        // Auth proxy - proxies /auth/* to backend (runs before filesystem check)
        {
          source: '/auth/:path*',
          destination: `${backendUrl}/auth/:path*`,
        },
      ],
    };
  },
};

module.exports = nextConfig;
