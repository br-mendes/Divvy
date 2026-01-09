import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  pageExtensions: ['active.tsx', 'active.ts'],
  reactStrictMode: true,
  swcMinify: true,
  images: {
    unoptimized: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  }
};

export default nextConfig;