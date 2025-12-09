'use client';

import dynamic from 'next/dynamic';
import Footer from './footer';
import { GoogleAnalytics } from '@next/third-parties/google';
import ProviderWrapper from '../data/provider-wrapper';

const Navbar = dynamic(() => import('./Navbar'));

export default function MainSiteWrapper({ children }) {
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
