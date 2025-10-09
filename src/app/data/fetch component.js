'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { getCompanies, getNews, getTeamMembers } from '../../../sanity/client';
import { coreTeam } from './coreTeam';

const DataContext = createContext(null);

export function DataProvider({ children }) {
  const [data, setData] = useState({
    status: 'loading',
    data: { companies: [], articles: [], team: [] },
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const [companies, articles, sanityTeam] = await Promise.all([
          getCompanies(),
          getNews(),
          getTeamMembers()
        ]);

        // Merge hardcoded core team with CMS team
        const allTeam = [...coreTeam, ...sanityTeam];

        setData({
          status: 'success',
          data: { companies, articles, team: allTeam },
        });
      } catch (err) {
        console.error('Error fetching from Sanity:', err);
        setError(err);
        setData({ status: 'error', data: { companies: [], articles: [], team: [] } });
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  return <DataContext.Provider value={{ data, loading, error }}>{children}</DataContext.Provider>;
}

export function useData() {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}