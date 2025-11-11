'use client';

import { useState } from 'react';
import styles from './ApplicationForm.module.css';

export default function ApplicationForm() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    pitch: ''
  });
  const [status, setStatus] = useState('idle'); // idle, submitting, success, error
  const [errorMessage, setErrorMessage] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('submitting');
    setErrorMessage('');

    try {
      const response = await fetch('/api/submit-application', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Submission failed');
      }

      setStatus('success');
      setFormData({ name: '', email: '', company: '', pitch: '' });
    } catch (error) {
      setStatus('error');
      setErrorMessage(error.message);
    }
  };

  const pitchLength = formData.pitch.length;
  const pitchWords = formData.pitch.trim().split(/\s+/).filter(Boolean).length;
  const maxChars = 700;

  return (
    <div className={styles.formContainer}>
      <div className={styles.formHeader}>
        <h2>Apply for Funding</h2>
        <p>Share your deep tech venture with us</p>
      </div>

      {status === 'success' ? (
        <div className={styles.successMessage}>
          <h3>Thank you for your application!</h3>
          <p>We've received your submission and will review it soon.</p>
          <button 
            onClick={() => setStatus('idle')}
            className={styles.submitButton}
          >
            Submit Another
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label htmlFor="name">Full Name *</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              disabled={status === 'submitting'}
              placeholder="Your full name"
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="email">Email *</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              disabled={status === 'submitting'}
              placeholder="your.email@company.com"
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="company">Company Name *</label>
            <input
              type="text"
              id="company"
              name="company"
              value={formData.company}
              onChange={handleChange}
              required
              disabled={status === 'submitting'}
              placeholder="Your company name"
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="pitch">
              100-Word Pitch *
              <span className={styles.counter}>
                {pitchWords}/100 words ({pitchLength}/{maxChars} chars)
              </span>
            </label>
            <textarea
              id="pitch"
              name="pitch"
              value={formData.pitch}
              onChange={handleChange}
              required
              disabled={status === 'submitting'}
              maxLength={maxChars}
              rows={6}
              placeholder="Tell us about your deep tech venture..."
            />
          </div>

          {status === 'error' && (
            <div className={styles.errorMessage}>
              {errorMessage}
            </div>
          )}

          <button 
            type="submit" 
            className={styles.submitButton}
            disabled={status === 'submitting'}
          >
            {status === 'submitting' ? 'Submitting...' : 'Submit Application'}
          </button>
        </form>
      )}
    </div>
  );
}
