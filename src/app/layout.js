import { Nunito, Roboto_Mono } from 'next/font/google'
import Navbar from './components/Navbar';
import './styles/globals.css';

const inter = Nunito({
  subsets: ['latin'],
  variable: '--font-nunito',
})

const roboto_mono = Roboto_Mono({
  subsets: ['latin'],
  variable: '--font-roboto-mono',
})

export const metadata = {
  title: `Yali Capital | Funding India's deep tech`,
  description: 'Powering the future of deep tech with investments in AI, Genomics, Robotics, Semiconductor and more.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${inter.variable} ${roboto_mono.variable}`}>
      <body className={inter.className}>
        <Navbar />
        {children}
      </body>
    </html>
  );
}