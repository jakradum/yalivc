'use client';

import s from './home.module.css';

export function SignOutButton() {
  async function out() {
    await fetch('/api/team-auth/', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'logout' }) });
    const prefix = /^(localhost|127\.0\.0\.1)/.test(window.location.hostname) ? '/team' : '';
    window.location.href = `${prefix}/sign-in`;
  }
  return (
    <button className={s.signOut} onClick={out}>
      Sign out
    </button>
  );
}
