/** @type {import('next').NextConfig} */
const nextConfig = {
  distDir: 'build',
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