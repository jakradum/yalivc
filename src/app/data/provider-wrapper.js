'use client';

import { DataProvider } from './fetch component';

export default function ProviderWrapper({ children }) {
  return <DataProvider>{children}</DataProvider>;
}
