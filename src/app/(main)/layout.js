import dynamic from 'next/dynamic';
import Footer from '../components/footer';
import { GoogleAnalytics } from '@next/third-parties/google';
import ProviderWrapper from '../data/provider-wrapper';

const Navbar = dynamic(() => import('../components/Navbar'));

export const metadata = {
  other: {
    'google-site-verification': 'AR3PWsXD41dfGKHMpdT6B-010eU3Q82FsTIW0uqdfGk',
  },
};

export default function MainLayout({ children }) {
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
