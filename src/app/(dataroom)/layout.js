import { Suspense } from 'react';
import { JetBrains_Mono } from 'next/font/google';
import './dataroom-globals.css';
import Footer from '@/app/components/footer';
import PdfViewer from './dataroom/PdfViewer';
import DataroomNavigationLoader from './NavigationLoader';

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  display: 'swap',
});

export const metadata = {
  title: 'Data Room | Yali Capital',
  description: "Yali Capital Investors' Data Room",
  robots: 'noindex, nofollow',
};

export default function DataroomLayout({ children }) {
  return (
    <div data-dataroom className={jetbrainsMono.className}>
      {children}
      <div style={{ position: 'relative', zIndex: 45 }}>
        <Footer />
      </div>
      <PdfViewer />
      <Suspense>
        <DataroomNavigationLoader />
      </Suspense>
    </div>
  );
}
