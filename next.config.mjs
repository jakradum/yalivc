const nextConfig = {
  reactStrictMode: true,
  async redirects() {
    return [
      { source: '/blog', destination: '/newsroom', permanent: false },
    ];
  },
  // The leave form and admin dashboard are HTML files read at request time by
  // their route handlers; make sure they ship with those functions. They live
  // outside public/ so they can't be fetched without the team sign-in.
  outputFileTracingIncludes: {
    '/team/leave': ['./src/app/(team)/team/_apps/request-form.html'],
    '/team/admin': ['./src/app/(team)/team/_apps/dashboard.html'],
  },
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