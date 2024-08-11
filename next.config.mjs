/** @type {import('next').NextConfig} */
const isProd = process.env.NODE_ENV === 'production'

const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['yali.vc'],
  },
  basePath: isProd ? '/yalivc' : '',
  assetPrefix: isProd ? '/yalivc/' : '',
  trailingSlash: true,
  ...(isProd ? { output: 'export' } : {}),
};

export default nextConfig;