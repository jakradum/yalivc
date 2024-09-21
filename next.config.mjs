const isProd = process.env.NODE_ENV === 'production';

const nextConfig = {
  reactStrictMode: true,
  images: {
    loader: 'custom',
    loaderFile: './image-loader.js',
    domains: ['jakradum.com', 'yali.vc'], // Add both domains
    unoptimized: true, // For static exports
  },
  basePath: '', // No need for a base path on your own domain
  assetPrefix: isProd ? 'https://jakradum.com' : '', // Use the full domain in production
  trailingSlash: true,
  output: 'export',
  experimental: {
    appDir: true,
  },
};

export default nextConfig;