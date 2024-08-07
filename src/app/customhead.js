// components/CustomHead.js

import Head from 'next/head';

export default function CustomHead() {
  return (
    <Head>
      <title>Yali Capital</title>
      <meta name="description" content="Your App Description" />
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="true" />
      <link
        href="https://fonts.googleapis.com/css2?family=Urbanist:ital,wght@0,100..900;1,100..900&display=swap"
        rel="stylesheet"
      />
    </Head>
  );
}
