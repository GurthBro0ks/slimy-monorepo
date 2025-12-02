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
                destination: 'http://127.0.0.1:3080/api/auth/callback',
            },
            {
                // Handle direct auth callback from Discord
                source: '/auth/discord/callback',
                destination: 'http://127.0.0.1:3080/api/auth/callback',
            },
            {
                // Proxy ALL /api/ routes to the backend (including auth), EXCEPT local stream, auth handlers, and club routes
                source: '/api/:path((?!stats/events/stream|auth/me|auth/logout|club/).*)',
                destination: 'http://127.0.0.1:3080/api/:path*',
            },
        ];
    },
};
export default nextConfig;
