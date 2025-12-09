'use client';

import { usePathname } from 'next/navigation';
import dynamic from 'next/dynamic';
import Footer from './components/footer';
import { GoogleAnalytics } from '@next/third-parties/google';
import ProviderWrapper from './data/provider-wrapper';

const Navbar = dynamic(() => import('./components/Navbar'));

export default function Template({ children }) {
  const pathname = usePathname();

  // Portal routes get no wrapper - they handle their own layout
  const isPortalRoute = pathname?.startsWith('/partners');

  if (isPortalRoute) {
    return children;
  }

  // Main site routes get the full wrapper with Navbar and Footer
  return (
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
  );
}
