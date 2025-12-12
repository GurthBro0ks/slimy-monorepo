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
      {
        source: '/api/:path*',
        destination: 'http://admin-api:3080/api/:path*',
      },
    ];
  },
  typescript: { ignoreBuildErrors: true },
};

module.exports = nextConfig;
