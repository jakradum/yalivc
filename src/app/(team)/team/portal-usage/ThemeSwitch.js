'use client';

import { useEffect, useState } from 'react';
import s from './dashboard.module.css';

// Day / Night / System. System (the default) follows the computer's setting, and
// falls back to day when there is none. The choice is kept in this browser only.
const KEY = 'portal-usage-theme';
const CHOICES = [['system', 'System'], ['light', 'Day'], ['dark', 'Night']];

// Runs before first paint (see THEME_SCRIPT), so a saved Day or Night never flashes.
export const THEME_SCRIPT = `try{var t=localStorage.getItem('${KEY}');if(t==='light'||t==='dark')document.currentScript.parentElement.dataset.theme=t}catch(e){}`;

export function ThemeSwitch() {
  const [theme, setTheme] = useState('system');

  useEffect(() => {
    try {
      const t = localStorage.getItem(KEY);
      if (t === 'light' || t === 'dark') setTheme(t);
    } catch {}
  }, []);

  const pick = (t) => {
    setTheme(t);
    const page = document.querySelector('[data-ops-page]');
    if (t === 'system') delete page.dataset.theme;
    else page.dataset.theme = t;
    try {
      if (t === 'system') localStorage.removeItem(KEY);
      else localStorage.setItem(KEY, t);
    } catch {}
  };

  return (
    <div className={s.theme} role="group" aria-label="Day or night">
      {CHOICES.map(([k, l]) => (
        <button key={k} type="button" className={k === theme ? s.themeOn : s.themeOff} aria-pressed={k === theme} onClick={() => pick(k)}>{l}</button>
      ))}
    </div>
  );
}
