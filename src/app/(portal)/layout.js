import { Suspense } from 'react';
import './portal-globals.css';
import NavigationLoader from './partners/NavigationLoader';

export const metadata = {
  title: "Limited Partners' Reports | Yali Capital",
  description: "Limited Partners' Reports - Quarterly Reports and Fund Updates",
  robots: 'noindex, nofollow',
};

export default function PortalLayout({ children }) {
  return (
    <>
      <Suspense fallback={null}>
        <NavigationLoader />
      </Suspense>
      {children}
    </>
  );
}
