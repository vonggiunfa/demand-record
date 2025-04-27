/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  devIndicators: false,
  basePath: '/demand-record',
  experimental: {
    serverComponentsExternalPackages: [],
    outputFileTracingIncludes: {
      '/api/*': ['data-json/**'],
    },
  },
  output: 'standalone',
  webpack: (config, { dev, isServer }) => {
    if (dev && isServer) {
      config.infrastructureLogging = {
        level: 'verbose',
        debug: /webpack/,
      };
    }
    return config;
  },
}

export default nextConfig
