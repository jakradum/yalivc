'use client';

import { useState } from 'react';
import styles from './sign-in.module.css';
import { LightMonogram } from '../../../components/icons/lightMonogram';
import { trackEvent } from '@/lib/analytics';
import { signInMessage } from '@/lib/sign-in/messages';

const API = '/api/portal-auth/';

async function post(body) {
  const res = await fetch(API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return { ok: res.ok, data: await res.json().catch(() => ({})) };
}

export default function SignInPage() {
  const [step, setStep] = useState('email'); // 'email' or 'code'
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendsLeft, setResendsLeft] = useState(1);

  const requestCode = async () => {
    const { ok, data } = await post({ action: 'send-code', email });
    if (!ok) {
      setError(signInMessage(data));
      return false;
    }
    setResendsLeft(data.resendsLeft ?? 0);
    return true;
  };

  const handleSendCode = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (await requestCode()) setStep('code');
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e) => {
    e.preventDefault();
    setError('');
    setNotice('');
    setLoading(true);
    try {
      const { ok, data } = await post({ action: 'verify-code', code, email });
      if (ok) {
        trackEvent('portal_login', { status: 'success', method: 'code' });
        const isLocalDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        window.location.href = isLocalDev ? '/partners' : '/';
      } else {
        trackEvent('portal_login', { status: 'error', method: 'code' });
        setError(signInMessage(data));
        setCode('');
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError('');
    setNotice('');
    setLoading(true);
    try {
      if (await requestCode()) {
        setCode('');
        setNotice('We sent you a new code. The earlier code no longer works.');
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <div className={styles.logoWrapper}>
          <LightMonogram />
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
                  required
                  autoComplete="email"
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
            <p className={styles.subtitle}>We sent a 6-digit code to <strong>{email}</strong></p>
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
              <p className={styles.hint}>{notice || 'It can take a minute to arrive. If you don’t see it, check your spam or junk folder.'}</p>
              {error && <p className={styles.error}>{error}</p>}
              <button type="submit" className={styles.submitButton} disabled={loading || code.length !== 6}>
                {loading ? 'Verifying...' : 'Verify & Sign In'}
              </button>
              <div className={styles.secondaryActions}>
                {resendsLeft > 0 && (
                  <button type="button" className={styles.linkButton} onClick={handleResend} disabled={loading}>
                    Resend code
                  </button>
                )}
                <button type="button" className={styles.linkButton} onClick={() => { setStep('email'); setCode(''); setError(''); setNotice(''); }}>
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
