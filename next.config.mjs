/** @type {import('next').NextConfig} */
const isGithubPages = process.env.GITHUB_PAGES === 'true';
const repoName = process.env.GITHUB_REPOSITORY?.split('/')[1];
const basePath = isGithubPages && repoName ? `/${repoName}` : '';

const nextConfig = {
  reactStrictMode: true,

  basePath,
  assetPrefix: basePath ? `${basePath}/` : undefined,

  images: { unoptimized: true },
};

export default nextConfig;