"use client"
import React from 'react';
import Image from 'next/image';
import { DataProvider, useData } from '../data/fetch component';
import localTeamData from '../data/team.json';
import styles from './detail styles.module.css';
import Button from '../components/button';

const TeamMember = ({ member }) => (
  <div className={styles.teamMember}>
    <div className={styles.memberInfo}>
      <h2 className={styles.name}>{member.Name}</h2>
      <p className={styles.designation}>{member.Designation}</p>
      <p className={styles.bio}>{member.Detailed}</p>
     <Button href={member.linkedin} color='black'>view on linkedin</Button>
    </div>
    <div className={styles.memberImage}>
      <Image
        src={member.image || "/placeholder-image.jpg"}
        alt={member.Name}
        width={400}
        height={400}
        objectFit="cover"
      />
    </div>
  </div>
);

const TeamList = () => {
  const { data } = useData();

  // Use local data for first 4 members
  const localMembers = localTeamData['Team Members'].slice(0, 4);

  // Use remote data for additional members, starting from order 5
  const remoteMembers =
    data && data.team && data.team['Team Members']
      ? data.team['Team Members'].filter((member) => member.Order > 4)
      : [];

  const teamMembers = [...localMembers, ...remoteMembers];

  return (
    <div className={styles.teamListContainer}>
      {teamMembers.map((member, index) => (
        <TeamMember key={index} member={member} />
      ))}
      <button className={styles.loadMore}>LOAD MORE</button>
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