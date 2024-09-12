import React from 'react';
import { DataProvider, useData } from '../data/fetch component';
import localTeamData from '../data/team.json';

const TeamList = () => {
  const { data, loading, error } = useData();

  // Use local data for first 4 members
  const localMembers = localTeamData['Team Members'].slice(0, 4);

  // Use remote data for additional members, starting from order 5
  const remoteMembers =
    data && data.team && data.team['Team Members']
      ? data.team['Team Members'].filter((member) => member.Order > 4)
      : [];

  const teamMembers = [...localMembers, ...remoteMembers];

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      <h1>Our Team</h1>
      {teamMembers.map((member, index) => (
        <div key={index}>
          <h2>{member.Name}</h2>
          <p>{member.Designation}</p>
          <p>{member['One-Liner']}</p>
          {member.linkedin && (
            <a href={member.linkedin} target="_blank" rel="noopener noreferrer">
              LinkedIn
            </a>
          )}
        </div>
      ))}
    </div>
  );
};

export const TeamDetails = () => {
  return (
    <DataProvider>
      <TeamList />
    </DataProvider>
  );
};

export default TeamDetails;