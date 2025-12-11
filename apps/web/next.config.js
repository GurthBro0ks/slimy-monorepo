/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'cdn.discordapp.com', pathname: '/**' },
      { protocol: 'https', hostname: 'media.discordapp.net', pathname: '/**' },
    ],
  },
  async rewrites() {
    return [
      {
        source: '/api/auth/discord/callback',
        destination: 'http://admin-api:3080/api/auth/callback',
      },
      {
        source: '/auth/discord/callback',
        destination: 'http://admin-api:3080/api/auth/callback',
      },
      {
        source: '/api/:path((?!stats/events/stream|auth/me|auth/logout|club/).*)',
        destination: 'http://admin-api:3080/api/:path*',
      },
    ];
  },
  typescript: { ignoreBuildErrors: true },
  // eslint config removed as it is deprecated in next.config.js
};
module.exports = nextConfig;
