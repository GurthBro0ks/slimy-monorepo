/** @type {import('next').NextConfig} */
const nextConfig = {
    async rewrites() {
        return [
            {
                // Map legacy Discord callback path to backend auth callback
                source: '/api/auth/discord/callback',
                destination: 'http://127.0.0.1:3080/api/auth/callback',
            },
            {
                // Proxy ALL /api/ routes to the backend (including auth)
                source: '/api/:path*',
                destination: 'http://127.0.0.1:3080/api/:path*',
            },
        ];
    },
};
export default nextConfig;
