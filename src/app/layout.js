import { Inter, JetBrains_Mono } from 'next/font/google'
import Navbar from './components/Navbar';
import './styles/globals.css';


const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
})


const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
})

export const metadata = {
  title: `Yali Capital | Funding India's deep tech`,
  description: 'Powering the future of deep tech with investments in AI, Genomics, Robotics, Semiconductor and more.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body className={inter.className}>
        <Navbar />
        {children}
      </body>
    </html>
  );
}