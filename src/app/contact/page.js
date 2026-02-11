import ContactClient from './ContactClient';

export const metadata = {
  title: 'Contact Us | Yali Capital - Deep Tech VC in Bangalore',
  description: 'Get in touch with Yali Capital. Pitch your deep tech startup, media inquiries, partnership opportunities. Bangalore-based venture capital firm investing in AI, robotics, and semiconductors.',
  keywords: 'contact Yali Capital, pitch deep tech startup, Bangalore VC contact, venture capital India contact, startup funding inquiry',
  alternates: {
    canonical: 'https://yali.vc/contact/',
  },
};

export default function Contact() {
  return <ContactClient />;
}
