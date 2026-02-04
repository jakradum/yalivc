import { Suspense } from 'react';
import './portal-globals.css';
import NavigationLoader from './partners/NavigationLoader';

export const metadata = {
  title: 'Partners Portal | Yali Capital',
  description: 'LP Partners Portal - Quarterly Reports and Fund Updates',
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
