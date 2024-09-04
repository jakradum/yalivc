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
  // Add this to allow using 'use client' directive
  experimental: {
    appDir: true,
  },
};

export default nextConfig;