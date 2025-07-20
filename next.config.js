/** @type {import('next').NextConfig} */
const nextConfig = {
  // Performance optimizations
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },

  // External packages for server components
  serverExternalPackages: ['@prisma/client'],

  // Code splitting and bundle optimization
  webpack: (config, { dev, isServer }) => {
    // Optimize bundle splitting
    if (!dev && !isServer) {
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
            priority: 10,
          },
          common: {
            name: 'common',
            minChunks: 2,
            chunks: 'all',
            priority: 5,
            reuseExistingChunk: true,
          },
          lucide: {
            test: /[\\/]node_modules[\\/]lucide-react[\\/]/,
            name: 'lucide',
            chunks: 'all',
            priority: 20,
          },
        },
      };
    }

    // Optimize for production
    if (!dev) {
      config.optimization.usedExports = true;
      config.optimization.sideEffects = false;
    }

    return config;
  },

  // Image optimization with reasonable caching
  images: {
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60, // 1 minute cache for development, longer in production
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },

  // Compression
  compress: true,

  // Headers with smart caching
  headers: async () => [
    {
      source: '/(.*)',
      headers: [
        {
          key: 'X-DNS-Prefetch-Control',
          value: 'on',
        },
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
      ],
    },
    {
      // Cache static assets for better performance
      source: '/icons/:path*',
      headers: [
        {
          key: 'Cache-Control',
          value: 'public, max-age=86400, stale-while-revalidate=604800', // 1 day cache, 1 week stale
        },
      ],
    },
    {
      // Cache API responses briefly to avoid unnecessary requests
      source: '/api/student/:path*',
      headers: [
        {
          key: 'Cache-Control',
          value: 'private, max-age=60, stale-while-revalidate=300', // 1 minute cache
        },
      ],
    },
    {
      // No cache for auth and critical APIs
      source: '/api/auth/:path*',
      headers: [
        {
          key: 'Cache-Control',
          value: 'no-store, no-cache, must-revalidate',
        },
      ],
    },
    {
      // Reasonable caching for static files
      source: '/_next/static/:path*',
      headers: [
        {
          key: 'Cache-Control',
          value: 'public, max-age=31536000, immutable', // 1 year for static assets
        },
      ],
    },
  ],

  // Performance monitoring
  poweredByHeader: false,
  reactStrictMode: true,

  // Only ignore errors in development for better DX
  eslint: {
    ignoreDuringBuilds: process.env.NODE_ENV === 'development',
  },

  typescript: {
    ignoreBuildErrors: process.env.NODE_ENV === 'development',
  },

  // Standalone for production deployment
  output: 'standalone',

  // Environment variables
  env: {
    NEXT_TELEMETRY_DISABLED: '1',
  },
};

export default nextConfig;
