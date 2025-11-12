import { Inter, JetBrains_Mono } from 'next/font/google';
import dynamic from 'next/dynamic';
import Footer from './components/footer';
import './styles/globals.css';
import Breadcrumb from './components/breadcrumb';
import { GoogleAnalytics } from '@next/third-parties/google';
import ProviderWrapper from './data/provider-wrapper';

const Navbar = dynamic(() => import('./components/Navbar'));

// layout.js - add display: 'swap'
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
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <head>
        <meta name="google-site-verification" content="AR3PWsXD41dfGKHMpdT6B-010eU3Q82FsTIW0uqdfGk" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.svg" />
      </head>
      <body className={inter.className}>
        <Navbar />
        <div className="page-wrapper">
          {/* <Breadcrumb /> */}

          {/* ✅ Wrap only the main content inside Provider */}
          <ProviderWrapper>
            <main>{children}</main>
          </ProviderWrapper>

          <Footer />
        </div>
        <GoogleAnalytics gaId="G-7F0015CFY2" />
      </body>
    </html>
  );
}
