const isProd = process.env.NODE_ENV === 'production'
const repoName = 'yalivc'

const nextConfig = {
  reactStrictMode: true,
  images: {
    loader: 'custom',
    loaderFile: './image-loader.js',
    domains: ['yali.vc'],
    unoptimized: true, // For static exports
  },
  basePath: isProd ? `/${repoName}` : '',
  assetPrefix: isProd ? `/${repoName}/` : '',
  trailingSlash: true,
  output: 'export',
  experimental: {
    appDir: true,
  },
};

export default nextConfig;