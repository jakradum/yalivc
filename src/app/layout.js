import { Inter, JetBrains_Mono } from 'next/font/google';
import dynamic from 'next/dynamic';
import Footer from './components/footer';
import './styles/globals.css';
import Head from 'next/head';

const Navbar = dynamic(() => import('./components/Navbar'), { ssr: false });

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
});

export const metadata = {
  title: "Yali Capital | Funding India's deep tech",
  description: 'Powering the future of deep tech with investments in AI, Genomics, Robotics, Semiconductor and more.',
  icons: {
    icon: '/favicon.svg',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.svg" />
      </Head>
      <body className={inter.className}>
        <Navbar />
        <div className="page-wrapper">
          <main>{children}</main>
          <Footer />
        </div>
      </body>
    </html>
  );
}