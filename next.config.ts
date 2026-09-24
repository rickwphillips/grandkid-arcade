import type { NextConfig } from 'next';

const isDev = process.env.NODE_ENV === 'development';

const nextConfig: NextConfig = {
  // Only use static export for production builds
  ...(isDev ? {} : { output: 'export' }),
  basePath: isDev ? '' : '/app/projects/grandkid-games',
  trailingSlash: true,
  // Static export has no image optimizer; next/image serves files as-is.
  images: { unoptimized: true },

  // Proxy PHP API requests in development
  async rewrites() {
    return isDev
      ? [
          {
            source: '/php-api/:path*',
            destination: 'http://localhost:8082/php-api/:path*',
          },
        ]
      : [];
  },
};

export default nextConfig;
