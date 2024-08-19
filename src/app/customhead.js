// components/CustomHead.js

import Head from 'next/head';

export default function CustomHead() {
  return (
    <Head>
      <title>Yali Capital</title>
      <meta name="description" content="Your App Description" />
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="true" />
      <link rel="icon" href="./src/app/components/favicon.svg" type="image/svg+xml" />
      <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
    </Head>
  );
}