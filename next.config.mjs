/** @type {import('next').NextConfig} */
const isProd = process.env.NODE_ENV === 'production'

const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['plus.unsplash.com'],
  },
  basePath: isProd ? '/yalivc' : '',
  assetPrefix: isProd ? '/yalivc/' : '',
  trailingSlash: true,
  ...(isProd ? { output: 'export' } : {}),
};

export default nextConfig;