const nextConfig = {
  reactStrictMode: true,
  serverExternalPackages: ['puppeteer-core', '@sparticuz/chromium-min', 'puppeteer'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.sanity.io',
      },
    ],
  },
  trailingSlash: true,
  // NO output: 'export' here
  env: {
    NEXT_PUBLIC_VERCEL_ENV: process.env.NEXT_PUBLIC_VERCEL_ENV || process.env.NODE_ENV,
  },
};

export default nextConfig;