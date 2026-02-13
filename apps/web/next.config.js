/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  eslint: { ignoreDuringBuilds: true },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'cdn.discordapp.com', pathname: '/**' },
      { protocol: 'https', hostname: 'media.discordapp.net', pathname: '/**' },
    ],
  },
  async rewrites() {
    return [
      {
        source: '/api/auth/:path*',
        destination: 'http://admin-api:3080/api/auth/:path*',
      },
      // Internal APIs that MUST stay in the web app (port 3000)
      {
        source: '/api/admin/:path*',
        destination: '/api/admin/:path*',
      },
      {
        source: '/api/owner/:path*',
        destination: '/api/owner/:path*',
      },
      {
        source: '/api/chat/:path*',
        destination: '/api/chat/:path*',
      },
      // All other /api/* goes to admin-api:3080
      {
        source: '/api/:path*',
        destination: 'http://admin-api:3080/api/:path*',
      },
    ];
  },
  typescript: { ignoreBuildErrors: true },
};

module.exports = nextConfig;
