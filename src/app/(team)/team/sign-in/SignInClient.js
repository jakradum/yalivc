'use client';

import { useState } from 'react';

// Same Firebase project and Microsoft provider as the leave dashboard
// (public client config). Sign-in is pinned to Yali's Microsoft tenant, and
// the tokens are verified again on the server before a session is issued.
const FIREBASE_CONFIG = {
  apiKey: 'AIzaSyAsBzoorZXRnlSbr1vn3I4Ch58Bd1ZrCv8',
  authDomain: 'yali-leave.firebaseapp.com',
  projectId: 'yali-leave',
  appId: '1:923907129499:web:738a4fd0344f7f8af4863e',
};
const TENANT_ID = 'b06b57f2-f87d-413e-88f1-e0d4ad82c2fd';
const SDK = 'https://www.gstatic.com/firebasejs/10.12.0';

const mono = 'var(--font-jetbrains-mono, "JetBrains Mono", monospace)';
const sans = 'var(--font-inter, "Inter", Arial, sans-serif)';

// Only ever return to the builder or Letters; anything else falls back home.
function safeNext(raw, prefix) {
  const ok = /^\/(team\/)?(asset-builder|builder|letters)(\/|$)/.test(raw || '');
  return ok ? raw : `${prefix}/asset-builder/`;
}

export function SignInClient({ deniedArea = null, deniedEmail = null }) {
  const [state, setState] = useState('idle'); // idle | working | error
  const [msg, setMsg] = useState('');
  const [detail, setDetail] = useState('');

  async function signIn() {
    setState('working');
    setMsg('');
    setDetail('');
    try {
      const [{ initializeApp, getApps }, { getAuth, OAuthProvider, signInWithPopup }] = await Promise.all([
        import(/* webpackIgnore: true */ /* turbopackIgnore: true */ `${SDK}/firebase-app.js`),
        import(/* webpackIgnore: true */ /* turbopackIgnore: true */ `${SDK}/firebase-auth.js`),
      ]);
      const app = getApps().length ? getApps()[0] : initializeApp(FIREBASE_CONFIG);
      const auth = getAuth(app);
      const provider = new OAuthProvider('microsoft.com');
      provider.setCustomParameters({ tenant: TENANT_ID, prompt: 'select_account' });
      ['openid', 'profile', 'email'].forEach((s) => provider.addScope(s));

      const result = await signInWithPopup(auth, provider);
      const cred = OAuthProvider.credentialFromResult(result);
      const tr = result._tokenResponse || {};
      const res = await fetch('/api/team-auth/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'microsoft', idToken: cred?.idToken || tr.oauthIdToken, accessToken: cred?.accessToken || tr.oauthAccessToken }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setDetail(json.detail || '');
        throw new Error(json.error || `Sign-in failed (${res.status})`);
      }
      const prefix = /^(localhost|127\.0\.0\.1)/.test(window.location.hostname) ? '/team' : '';
      window.location.href = safeNext(new URLSearchParams(window.location.search).get('next'), prefix);
    } catch (e) {
      const cancelled = /popup-closed|cancelled-popup/.test(e.code || e.message || '');
      setMsg(cancelled ? 'Sign-in was cancelled.' : e.message || 'Sign-in failed.');
      setState('error');
    }
  }

  return (
    <div style={{ fontFamily: sans, minHeight: '100vh', background: 'linear-gradient(135deg, #f8f7f5 0%, #e4dfd8 50%, #d8d2cb 100%)', color: '#363636' }}>
      <div style={{ background: '#830d35', height: 52, display: 'flex', alignItems: 'center', padding: '0 28px', gap: 14, borderBottom: '1px solid #363636', boxSizing: 'border-box' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/favicon.svg" alt="Yali" style={{ height: 22, width: 'auto', filter: 'brightness(0) invert(1)', display: 'block' }} />
        <span style={{ width: 1, height: 16, background: 'rgba(239,239,239,0.25)' }} />
        <span style={{ fontFamily: mono, fontSize: 13, color: '#efefef' }}>Team</span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 24px' }}>
        <div style={{ width: '100%', maxWidth: 420, border: '1px solid #363636', borderTop: '3px solid #830d35', background: 'rgba(255,255,255,0.92)', padding: '32px 28px', boxSizing: 'border-box' }}>
          <div style={{ fontFamily: mono, fontSize: 10, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#830d35', marginBottom: 14 }}>Yali team</div>
          <h1 style={{ fontFamily: mono, fontSize: 20, fontWeight: 400, margin: '0 0 12px', lineHeight: 1.3 }}>Sign in</h1>
          {deniedArea ? (
            <p role="alert" style={{ fontSize: 13, color: '#a11', lineHeight: 1.6, margin: '0 0 20px' }}>
              {deniedEmail} is signed in, but doesn’t have access to {deniedArea}. If you need it, ask Pranav — or sign in with a different account.
            </p>
          ) : null}
          <p style={{ fontSize: 13, color: '#595959', lineHeight: 1.7, margin: '0 0 24px' }}>Use your Yali Microsoft account to continue.</p>
          <button
            onClick={signIn}
            disabled={state === 'working'}
            style={{ width: '100%', fontFamily: mono, fontSize: 13, padding: '12px 16px', background: '#830d35', color: '#fff', border: 0, cursor: state === 'working' ? 'default' : 'pointer', opacity: state === 'working' ? 0.6 : 1 }}
          >
            {state === 'working' ? 'Signing in…' : deniedArea ? 'Use a different account' : 'Sign in with Microsoft'}
          </button>
          {state === 'error' ? (
            <div role="alert" style={{ marginTop: 16, fontSize: 13, color: '#a11', lineHeight: 1.5 }}>
              {msg}
              {detail ? <div style={{ marginTop: 6, fontFamily: mono, fontSize: 11, color: '#888', wordBreak: 'break-word' }}>{detail}</div> : null}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
