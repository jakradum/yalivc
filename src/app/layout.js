import { Inter, JetBrains_Mono } from 'next/font/google';
import './styles/globals.css';
import { headers } from 'next/headers';
import Navbar from './components/Navbar';
import Footer from './components/footer';
import { GoogleAnalytics } from '@next/third-parties/google';
import ProviderWrapper from './data/provider-wrapper';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
  weight: ['400', '500', '600', '700'],
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
  display: 'swap',
});

export const metadata = {
  title: "Yali Capital | Deep Tech Venture Capital in Bangalore, India",
  description:
    'Deep tech venture capital firm in Bangalore investing in AI, robotics, semiconductors, genomics, and aerospace. Tech investing in India\'s most promising startups with cutting-edge innovation.',
  keywords: 'deep tech venture capital, tech investing in india, bangalore venture capital, tech venture capital, AI investing, robotics investing, semiconductor investing',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '32x32' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-96x96.png', sizes: '96x96', type: 'image/png' },
      { url: '/favicon-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/favicon.svg', type: 'image/svg+xml' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    shortcut: '/favicon.ico',
  },
  manifest: '/site.webmanifest',
  verification: {
    google: 'AR3PWsXD41dfGKHMpdT6B-010eU3Q82FsTIW0uqdfGk',
  },
};

export default async function RootLayout({ children }) {
  const headersList = await headers();
  const pathname = headersList.get('x-pathname') || '';
  const isPortalRoute = pathname.startsWith('/partners');

  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <script src="https://analytics.ahrefs.com/analytics.js" data-key="6eCPyIGmj8Lj1meaCoGOIg" async></script>
      </head>
      <body className={inter.className}>
        {isPortalRoute ? (
          children
        ) : (
          <>
            <Navbar />
            <div className="page-wrapper">
              <ProviderWrapper>
                <main>{children}</main>
              </ProviderWrapper>
              <Footer />
            </div>
            <GoogleAnalytics gaId="G-7F0015CFY2" />
          </>
        )}
      </body>
    </html>
  );
}
