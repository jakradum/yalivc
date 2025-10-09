const isProd = process.env.NODE_ENV === 'production';

const nextConfig = {
  reactStrictMode: true,
  images: {
    loader: 'custom',
    loaderFile: './image-loader.js',
    domains: ['yali.vc', 'cdn.sanity.io'],
    unoptimized: true,
  },
  basePath: '',
  assetPrefix: isProd ? 'https://yali.vc' : '',
  trailingSlash: true,
  // Remove output: 'export' - we need dynamic features for forms/API
  experimental: {
    appDir: true,
  },
};

export default nextConfig;