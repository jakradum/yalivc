'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import companiesData from './companies.json';
import newsData from './news.json';
import teamData from './team.json';

const DataContext = createContext(null);

const ENDPOINT_URL = 'https://script.googleusercontent.com/macros/echo?user_content_key=wMwqmD3hyEfjuyzrmit9jSDCLn5xdX1dHEGRoaIRU6my1Wo8PMkPxs98lDD7aWYsb4e6JeD_-mz3WDdMRgeUiCS1qgMJ1hhYm5_BxDlH2jW0nuo2oDemN9CCS2h10ox_1xSncGQajx_ryfhECjZEnO7Olp7pqFy3TogCoZyFUbirTpo2gKpFMxR5S6ehinpBH3e6cC_4M7e1OIWPPuzQWGgZZi-ESOrh77Vl3ZGmdGSdJoCw8JvXDg&lib=MmHDKL-d2iWmU93zHCQ7t4_c2JwAnkCxa';

export function DataProvider({ children, useLocalOnly = false }) {
  const [data, setData] = useState({ companies: companiesData, news: newsData, team: teamData });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchData() {
      if (useLocalOnly) {
        console.log('Using local data only');
        return; // Don't fetch if useLocalOnly is true
      }

      setLoading(true);
      try {
        const response = await fetch(ENDPOINT_URL);
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        const result = await response.json();
        console.log('Fetched data:', result);
        setData(result);
      } catch (error) {
        console.error('Error fetching data:', error);
        setError(error);
        // We're already using local data as initial state, so no need to set it again
      } finally {
        setLoading(false);
      }
    }

    // Only fetch data on the client side and if not using local only
    if (typeof window !== 'undefined' && !useLocalOnly) {
      fetchData();
    }
  }, [useLocalOnly]);

  return (
    <DataContext.Provider value={{ data, loading, error }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}