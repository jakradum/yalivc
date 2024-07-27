
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['plus.unsplash.com'],
  },
  basePath: '/yalivc',
  assetPrefix: '/yalivc/',
  trailingSlash: true,
  output: 'export',
};

export default nextConfig;
