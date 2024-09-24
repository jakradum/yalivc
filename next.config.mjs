const isProd = process.env.NODE_ENV === 'production';

const nextConfig = {
  reactStrictMode: true,
  images: {
    loader: 'custom',
    loaderFile: './image-loader.js',
    domains: ['yali.vc'], // Only include the domain you're deploying to
    unoptimized: true, // For static exports
  },
  basePath: '', // No need for a base path on your own domain
  assetPrefix: isProd ? 'https://yali.vc' : '', // Use the full domain in production
  trailingSlash: true,
  output: 'export',
  experimental: {
    appDir: true,
  },
};

export default nextConfig;