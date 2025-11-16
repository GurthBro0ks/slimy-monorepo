import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Output configuration for production
  output: 'standalone',

  // Performance optimizations
  poweredByHeader: false,

  // Compression
  compress: true,

  // Image optimization with CDN support
  images: {
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 86400, // 24 hours
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    // CDN configuration
    loader: 'default',
    path: process.env.NEXT_PUBLIC_CDN_URL || '/_next/image',
    domains: [
      // Add your CDN domains here
      ...(process.env.NEXT_PUBLIC_CDN_DOMAIN ? [process.env.NEXT_PUBLIC_CDN_DOMAIN] : []),
      // Default domains for development
      'localhost',
      '127.0.0.1',
    ],
  },

  // Bundle analysis and optimization
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // Bundle analyzer (only in production builds)
    if (!dev && process.env.ANALYZE === 'true') {
      const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
      config.plugins.push(
        new BundleAnalyzerPlugin({
          analyzerMode: 'static',
          openAnalyzer: false,
          reportFilename: './analyze/client.html',
        })
      );
    }

    // Optimize chunks with better code splitting
    if (!dev) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            // Framework chunks (React, Next.js)
            framework: {
              test: /[\\/]node_modules[\\/](react|react-dom|scheduler|next)[\\/]/,
              name: 'framework',
              chunks: 'all',
              priority: 40,
              enforce: true,
            },
            // UI library chunks
            radix: {
              test: /[\\/]node_modules[\\/]@radix-ui[\\/]/,
              name: 'radix-ui',
              chunks: 'all',
              priority: 30,
            },
            lucide: {
              test: /[\\/]node_modules[\\/]lucide-react[\\/]/,
              name: 'lucide-react',
              chunks: 'all',
              priority: 30,
            },
            // Common vendor chunks
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendors',
              chunks: 'all',
              priority: 10,
              minChunks: 2,
            },
            // Common code shared across pages
            common: {
              name: 'common',
              minChunks: 2,
              chunks: 'all',
              priority: 5,
              reuseExistingChunk: true,
            },
          },
        },
        // Enable tree shaking
        usedExports: true,
        sideEffects: false,
      };
    }

    // Tree shaking for lucide-react - ensure individual icon imports
    if (!isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        'lucide-react': require.resolve('lucide-react'),
      };
    }

    return config;
  },

  // Experimental features for performance
  experimental: {
    optimizeCss: true,
    scrollRestoration: true,
    typedRoutes: true,
  },

  // Production optimizations
  productionBrowserSourceMaps: false,

  // Headers for performance and security
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
      // Cache static assets aggressively
      {
        source: '/_next/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
          {
            key: 'CDN-Cache-Control',
            value: 'max-age=31536000',
          },
        ],
      },
      // Cache images with CDN optimization
      {
        source: '/_next/image(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400, stale-while-revalidate=604800',
          },
          {
            key: 'CDN-Cache-Control',
            value: 'max-age=86400',
          },
        ],
      },
      // Cache static files (CSS, JS, fonts)
      {
        source: '/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
          {
            key: 'CDN-Cache-Control',
            value: 'max-age=31536000',
          },
        ],
      },
    ];
  },

  // Redirects and rewrites for performance
  async rewrites() {
    return [
      // API proxy for development
      {
        source: '/api/:path*',
        destination: `${process.env.NEXT_PUBLIC_ADMIN_API_BASE || 'http://admin-api:3080'}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
