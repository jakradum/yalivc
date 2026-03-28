'use client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import styles from './dataroom.module.css';

export default function SignOutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSignOut = async () => {
    setLoading(true);
    try {
      await fetch('/api/dataroom-auth/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'sign-out' }),
      });
    } finally {
      const isLocalDev =
        window.location.hostname === 'localhost' ||
        window.location.hostname === '127.0.0.1';
      router.push(isLocalDev ? '/dataroom/sign-in' : '/sign-in');
    }
  };

  return (
    <button className={styles.signOut} onClick={handleSignOut} disabled={loading}>
      {loading ? 'Signing out…' : 'Sign out'}
    </button>
  );
}
