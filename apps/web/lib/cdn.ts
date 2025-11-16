/**
 * CDN configuration and utilities
 */

export interface CDNConfig {
  enabled: boolean;
  baseUrl: string;
  domains: string[];
  cacheBusting: boolean;
}

/**
 * Default CDN configuration
 */
const DEFAULT_CDN_CONFIG: CDNConfig = {
  enabled: !!process.env.NEXT_PUBLIC_CDN_URL,
  baseUrl: process.env.NEXT_PUBLIC_CDN_URL || '',
  domains: (process.env.NEXT_PUBLIC_CDN_DOMAINS || '').split(',').filter(Boolean),
  cacheBusting: process.env.NODE_ENV === 'production',
};

/**
 * Get CDN configuration
 */
export function getCDNConfig(): CDNConfig {
  return {
    ...DEFAULT_CDN_CONFIG,
    enabled: DEFAULT_CDN_CONFIG.enabled,
    baseUrl: DEFAULT_CDN_CONFIG.baseUrl,
    domains: DEFAULT_CDN_CONFIG.domains,
    cacheBusting: DEFAULT_CDN_CONFIG.cacheBusting,
  };
}

/**
 * Generate CDN URL for a static asset
 */
export function getCDNUrl(path: string, config?: Partial<CDNConfig>): string {
  const cdnConfig = { ...getCDNConfig(), ...config };

  if (!cdnConfig.enabled || !cdnConfig.baseUrl) {
    return path;
  }

  // Remove leading slash if present
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;

  // Add cache busting parameter if enabled
  const cacheBust = cdnConfig.cacheBusting ? `?v=${Date.now()}` : '';

  return `${cdnConfig.baseUrl}/${cleanPath}${cacheBust}`;
}

/**
 * CDN asset types and their optimized loading strategies
 */
export const CDN_ASSET_TYPES = {
  images: {
    extensions: ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.avif', '.svg'],
    preload: true,
    priority: 'high',
  },
  fonts: {
    extensions: ['.woff', '.woff2', '.ttf', '.eot'],
    preload: true,
    priority: 'high',
  },
  scripts: {
    extensions: ['.js', '.mjs'],
    preload: false,
    priority: 'medium',
  },
  styles: {
    extensions: ['.css'],
    preload: true,
    priority: 'high',
  },
} as const;

/**
 * Determine asset type from path
 */
export function getAssetType(path: string): keyof typeof CDN_ASSET_TYPES | null {
  const extension = path.toLowerCase().substring(path.lastIndexOf('.'));

  const entries = Object.entries(CDN_ASSET_TYPES) as Array<
    [keyof typeof CDN_ASSET_TYPES, (typeof CDN_ASSET_TYPES)[keyof typeof CDN_ASSET_TYPES]]
  >;

  for (const [type, config] of entries) {
    if ((config.extensions as readonly string[]).includes(extension)) {
      return type;
    }
  }

  return null;
}

/**
 * Generate preload link for CDN assets
 */
export function generatePreloadLink(path: string): string | null {
  const cdnUrl = getCDNUrl(path);
  const assetType = getAssetType(path);

  if (!assetType) return null;

  const assetConfig = CDN_ASSET_TYPES[assetType];

  if (!assetConfig.preload) return null;

  let rel = 'preload';
  let as = '';

  switch (assetType) {
    case 'images':
      as = 'image';
      break;
    case 'fonts':
      as = 'font';
      rel = 'preload';
      break;
    case 'scripts':
      as = 'script';
      break;
    case 'styles':
      as = 'style';
      break;
  }

  return `<link rel="${rel}" href="${cdnUrl}" as="${as}" crossorigin="anonymous" />`;
}

/**
 * CDN optimization utilities
 */
export const CDNUtils = {
  /**
   * Check if CDN is properly configured
   */
  isConfigured(): boolean {
    const config = getCDNConfig();
    return config.enabled && !!config.baseUrl;
  },

  /**
   * Get CDN health status
   */
  async getHealthStatus(): Promise<{
    configured: boolean;
    reachable: boolean;
    responseTime?: number;
  }> {
    const config = getCDNConfig();
    const status = {
      configured: this.isConfigured(),
      reachable: false,
      responseTime: undefined as number | undefined,
    };

    if (!status.configured) {
      return status;
    }

    try {
      const startTime = Date.now();
      const response = await fetch(`${config.baseUrl}/favicon.ico`, {
        method: 'HEAD',
        cache: 'no-cache',
      });
      const endTime = Date.now();

      status.reachable = response.ok;
      status.responseTime = endTime - startTime;
    } catch (error) {
      console.warn('CDN health check failed:', error);
    }

    return status;
  },

  /**
   * Generate CDN configuration for deployment
   */
  generateDeploymentConfig(provider: 'cloudflare' | 'aws' | 'vercel' | 'netlify') {
    const config = getCDNConfig();

    switch (provider) {
      case 'cloudflare':
        return {
          'Cache-Control': 'public, max-age=31536000, immutable',
          'CDN-Cache-Control': 'max-age=31536000',
        };

      case 'aws':
        return {
          'Cache-Control': 'public, max-age=31536000, immutable',
          'CloudFront-Max-Age': '31536000',
        };

      case 'vercel':
        return {
          'Cache-Control': 'public, max-age=31536000, immutable',
        };

      case 'netlify':
        return {
          'Cache-Control': 'public, max-age=31536000, immutable',
        };

      default:
        return {};
    }
  },
} as const;
