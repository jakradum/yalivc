'use client';

import { useState } from 'react';
import styles from './sign-in.module.css';
import { Lightlogo } from '../../../components/icons/lightlogo';

export default function SignInPage() {
  const [step, setStep] = useState('email'); // 'email' or 'code'
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [ref, setRef] = useState('');
  const [isSharedDomain, setIsSharedDomain] = useState(false);

  const checkDomain = async (val) => {
    const domain = val.split('@')[1];
    if (!domain) return;
    try {
      const res = await fetch(`/api/check-domain/?domain=${encodeURIComponent(domain)}`);
      const data = await res.json();
      setIsSharedDomain(!!data.shared);
    } catch {
      setIsSharedDomain(false);
    }
  };

  const handleEmailBlur = (e) => {
    if (e.target.value.includes('@')) checkDomain(e.target.value);
  };

  const handleSharedSignIn = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/portal-auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'verify-code', code, email }),
      });
      const data = await res.json();
      if (res.ok) {
        const isLocalDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        window.location.href = isLocalDev ? '/partners' : '/';
      } else {
        setError(data.error || 'Invalid code');
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSendCode = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/portal-auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'send-code', email }),
      });

      const data = await res.json();

      if (res.ok) {
        setRef(data.ref || '');
        setStep('code');
      } else {
        setError(data.error || 'Something went wrong');
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/portal-auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'verify-code', code, email }),
      });

      const data = await res.json();

      if (res.ok) {
        const isLocalDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        window.location.href = isLocalDev ? '/partners' : '/';
      } else {
        setError(data.error || 'Verification failed');
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/portal-auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'send-code', email }),
      });
      if (res.ok) {
        setError('');
        setCode('');
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to resend code');
      }
    } catch {
      setError('Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  if (isSharedDomain) {
    return (
      <div className={styles.container}>
        <div className={styles.content}>
          <div className={styles.logoWrapper}>
            <Lightlogo />
          </div>
          <h1 className={styles.title}>Limited Partners' Reports</h1>
          <p className={styles.subtitle}>Enter your email and access code to sign in</p>
          <form className={styles.form} onSubmit={handleSharedSignIn}>
            <div className={styles.fieldGroup}>
              <label className={styles.label} htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                className={styles.input}
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={handleEmailBlur}
                required
              />
            </div>
            <div className={styles.fieldGroup}>
              <label className={styles.label} htmlFor="code">Access Code</label>
              <input
                id="code"
                type="text"
                inputMode="numeric"
                className={`${styles.input} ${styles.codeInput}`}
                placeholder="000000"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                maxLength={6}
                required
              />
            </div>
            {error && <p className={styles.error}>{error}</p>}
            <button type="submit" className={styles.submitButton} disabled={loading || code.length !== 6}>
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <div className={styles.logoWrapper}>
          <Lightlogo />
        </div>
        <h1 className={styles.title}>Limited Partners' Reports</h1>

        {step === 'email' ? (
          <>
            <p className={styles.subtitle}>Enter your email to receive a verification code</p>
            <form className={styles.form} onSubmit={handleSendCode}>
              <div className={styles.fieldGroup}>
                <label className={styles.label} htmlFor="email">Email</label>
                <input
                  id="email"
                  type="email"
                  className={styles.input}
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onBlur={handleEmailBlur}
                  required
                />
              </div>
              {error && <p className={styles.error}>{error}</p>}
              <button type="submit" className={styles.submitButton} disabled={loading}>
                {loading ? 'Sending...' : 'Send Code'}
              </button>
            </form>
          </>
        ) : (
          <>
            <p className={styles.subtitle}>{ref === 'DOMAIN-SHARED' ? 'Enter your shared access code' : <>We sent a 6-digit code to <strong>{email}</strong></>}</p>
            {ref && <p className={styles.refCode}>{ref}</p>}
            <form className={styles.form} onSubmit={handleVerifyCode}>
              <div className={styles.fieldGroup}>
                <label className={styles.label} htmlFor="code">Verification Code</label>
                <input
                  id="code"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  className={`${styles.input} ${styles.codeInput}`}
                  placeholder="000000"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  maxLength={6}
                  required
                />
              </div>
              {error && <p className={styles.error}>{error}</p>}
              <button type="submit" className={styles.submitButton} disabled={loading || code.length !== 6}>
                {loading ? 'Verifying...' : 'Verify & Sign In'}
              </button>
              <div className={styles.secondaryActions}>
                <button type="button" className={styles.linkButton} onClick={handleResend} disabled={loading}>
                  Resend code
                </button>
                <button type="button" className={styles.linkButton} onClick={() => { setStep('email'); setCode(''); setError(''); }}>
                  Use a different email
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
