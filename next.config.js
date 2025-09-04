/** @type {import('next').NextConfig} */
const nextConfig = {
  // ❌ Static export conflicts with headers/middleware/PWA. Keep it here but disabled:
  // output: 'export',

  eslint: {
    ignoreDuringBuilds: true,
  },

  images: { unoptimized: true },

  // PWA Configuration
  experimental: {
    webpackBuildWorker: true,
  },

  // Performance optimizations
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },

  // ✅ Dev-only: avoid flaky Webpack FS cache renames in Bolt/WebContainers
  // (no effect in production builds)
  webpack: (config, { dev }) => {
    if (dev) {
      // use in-memory cache to prevent ENOENT .pack.gz_ → .gz rename errors
      config.cache = { type: 'memory' }; // or simply: false
    }
    return config;
  },

  // Headers for PWA (allowed once output:'export' is not active)
  async headers() {
    return [
      {
        source: '/manifest.json',
        headers: [
          { key: 'Content-Type', value: 'application/manifest+json' },
        ],
      },
      {
        source: '/sw.js',
        headers: [
          { key: 'Content-Type', value: 'application/javascript' },
          { key: 'Service-Worker-Allowed', value: '/' },
        ],
      },
    ];
  },
};

module.exports = nextConfig;