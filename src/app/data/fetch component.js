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
        console.log('📡 Fetching data from Sanity...');

        const [companies, articles, sanityTeam] = await Promise.all([
          getCompanies(),
          getNews(),
          getTeamMembers(),
        ]);

        // ✅ Normalize coreTeam fields to match the Sanity schema
        const normalizedCoreTeam = coreTeam.map((member) => ({
          name: member.name,
          role: member.designation, // normalize designation → role
          bio: member.detailed,     // normalize detailed → bio
          photo: member.image,      // normalize image → photo
          linkedIn: member.linkedin,
          order: member.order,
        }));

        // ✅ Merge normalized core team and Sanity team
        const allTeam = [...normalizedCoreTeam, ...sanityTeam];

        setData({
          status: 'success',
          data: { companies, articles, team: allTeam },
        });

        console.log('✅ Data fetched successfully. Team count:', allTeam.length);
      } catch (err) {
        console.error('❌ Error fetching from Sanity:', err);
        setError(err);
        setData({
          status: 'error',
          data: { companies: [], articles: [], team: [] },
        });
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

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
