/** @type {import('next').NextConfig} */
const isProd = process.env.NODE_ENV === 'production'

const nextConfig = {
  reactStrictMode: true,
  images: {
    loader: 'custom',
    loaderFile: './image-loader.js',
    domains: ['yali.vc'],
  },
  basePath: isProd ? '/yalivc' : '',
  assetPrefix: isProd ? 'https://jakradum.github.io/yalivc' : '',
  trailingSlash: true,
  output: 'export',
};

export default nextConfig;