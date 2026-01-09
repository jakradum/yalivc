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
  title: "Yali Capital | Funding India's deep tech",
  description:
    'Powering the future of deep tech with investments in AI, Genomics, Robotics, Semiconductor and more.',
  icons: {
    icon: '/favicon.svg',
  },
  verification: {
    google: 'AR3PWsXD41dfGKHMpdT6B-010eU3Q82FsTIW0uqdfGk',
  },
};

export default function RootLayout({ children }) {
  const headersList = headers();
  const pathname = headersList.get('x-pathname') || '';
  const isPortalRoute = pathname.startsWith('/partners');

  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.svg" />
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
