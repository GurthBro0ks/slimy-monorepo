const isProduction = process.env.NODE_ENV === 'production';
const adminApiInternalUrl = process.env.ADMIN_API_INTERNAL_URL
    || (isProduction ? 'http://slimy-admin-api:3080' : 'http://127.0.0.1:3080');

/** @type {import('next').NextConfig} */
const nextConfig = {
    output: 'standalone',
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'cdn.discordapp.com',
                pathname: '/**',
            },
            {
                protocol: 'https',
                hostname: 'media.discordapp.net',
                pathname: '/**',
            },
        ],
    },
    async rewrites() {
        return [
            {
                // Map legacy Discord callback path to backend auth callback
                source: '/api/auth/discord/callback',
                destination: `${adminApiInternalUrl}/api/auth/callback`,
            },
            {
                // Handle direct auth callback from Discord
                source: '/auth/discord/callback',
                destination: `${adminApiInternalUrl}/api/auth/callback`,
            },
            {
                // Proxy ALL /api/ routes to the backend (including auth), EXCEPT local handlers
                source: '/api/:path((?!stats/events/stream|auth/me|auth/logout|club/|discord/guilds).*)',
                destination: `${adminApiInternalUrl}/api/:path*`,
            },
        ];
    },
};
export default nextConfig;
