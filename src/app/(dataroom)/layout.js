import { JetBrains_Mono } from 'next/font/google';
import './dataroom-globals.css';
import Footer from '@/app/components/footer';

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  display: 'swap',
});

export const metadata = {
  title: 'Data Room | Yali Capital',
  description: 'Yali Capital Investor Data Room',
  robots: 'noindex, nofollow',
};

export default function DataroomLayout({ children }) {
  return (
    <div data-dataroom className={jetbrainsMono.className}>
      {children}
      <Footer />
    </div>
  );
}
