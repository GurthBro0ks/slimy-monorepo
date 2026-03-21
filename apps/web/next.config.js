/* eslint-disable no-undef */
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
  typescript: { ignoreBuildErrors: true },
};

module.exports = nextConfig;
