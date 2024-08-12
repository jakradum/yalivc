/** @type {import('next').NextConfig} */
const isProd = process.env.NODE_ENV === 'production'

const nextConfig = {
  reactStrictMode: true,
  images: {
    loader: 'custom',
    loaderFile: './image-loader.js',
    domains: ['yali.vc'],
  },
  basePath: '',  // Remove the basePath
  assetPrefix: isProd ? 'https://jakradum.com' : '',  // Use your actual domain here
  trailingSlash: true,
  ...(isProd ? { output: 'export' } : {}),
};

export default nextConfig;