/** @type {import('next').NextConfig} */
const isGithubPages = process.env.GITHUB_PAGES === 'true';
const repoName = process.env.GITHUB_REPOSITORY?.split('/')[1];
const basePath = isGithubPages && repoName ? `/${repoName}` : '';

const nextConfig = {
  reactStrictMode: true,

  // GitHub Pages support (desligado na Vercel se GITHUB_PAGES != true)
  basePath,
  assetPrefix: basePath ? `${basePath}/` : undefined,

  // SSR na Vercel: NÃO forçar trailingSlash (mais seguro)
  // trailingSlash: true,

  images: { unoptimized: true },

  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
};

export default nextConfig;
