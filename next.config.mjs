const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['cdn.sanity.io', 'yali.vc'],
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