'use client';

import { useState, useRef, useEffect } from 'react';
import styles from './ContactForm.module.css';
import HeaderFlex from '../components/icons/headerflex';
import { rightArrowSlideicon as RightArrowSlideIcon } from '../components/icons/small icons/rightArrowSlideicon';
import categoriesData from '../data/categories.json';

export default function ContactForm() {
  const [formData, setFormData] = useState({
    name: '',
    companyName: '',
    email: '',
    category: '',
    customCategory: '',
    companyStage: '',
    fundingAmount: '',
    pitchFile: null,
    message: '',
  });

  const [wordCount, setWordCount] = useState(0);
  const [charCount, setCharCount] = useState(0);
  const [fileName, setFileName] = useState('');
  const [showCustomCategory, setShowCustomCategory] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [blockReason, setBlockReason] = useState('');

  // Honeypot for bot detection
  const [honeypot, setHoneypot] = useState('');

  // Swipe functionality states
  const [isMobile, setIsMobile] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const dragPositionRef = useRef(0);
  const [visualPosition, setVisualPosition] = useState(0);
  const buttonRef = useRef(null);
  const startXRef = useRef(0);

  const [emailError, setEmailError] = useState('');

  // Add handler
  const handleEmailBlur = () => {
    const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (formData.email && !emailPattern.test(formData.email)) {
      setEmailError('Please enter a valid email address');
    } else {
      setEmailError('');
    }
  };

  // Detect mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 600);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Get categories from JSON and add "Other"
  const categories = [...categoriesData.emergingTechnologies, 'Other'];

  // Capitalize first letter of each word
  const capitalizeWords = (str) => {
    return str
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Show/hide custom category field based on category selection
    if (name === 'category') {
      setShowCustomCategory(value === 'Other');
      if (value !== 'Other') {
        setFormData((prev) => ({ ...prev, customCategory: '' }));
      }
    }

    // Update word and character count for message field
    if (name === 'message') {
      const words = value.trim().split(/\s+/).filter(Boolean).length;
      const chars = value.length;
      setWordCount(words);
      setCharCount(chars);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData((prev) => ({ ...prev, pitchFile: file }));
      setFileName(file.name);
    }
  };

  const submitToAPI = async () => {
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/submit-application', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          companyName: formData.companyName,
          email: formData.email,
          category: formData.category,
          customCategory: formData.customCategory,
          companyStage: formData.companyStage,
          fundingAmount: formData.fundingAmount,
          message: formData.message,
          honeypot: honeypot,
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setSubmittedEmail(formData.email);
        setIsSubmitted(true);
      } else {
        // Block the user - show rejection message
        setIsBlocked(true);
        setBlockReason(result.error || 'Invalid credentials');
        setIsSubmitting(false);
      }
    } catch (error) {
      console.error('Submission error:', error);
      setIsBlocked(true);
      setBlockReason('Network error. Please try again later.');
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e) => {
  e.preventDefault();

  // Form validation
  if (wordCount > 100 || charCount > 600) {
    alert('Please ensure your message is within 100 words or 600 characters');
    return;
  }

  await submitToAPI();
};

  const isFormValid = () => {
    // Email regex pattern
    const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

    const baseValidation =
      formData.name &&
      formData.companyName &&
      formData.email &&
      emailPattern.test(formData.email) &&
      formData.category &&
      formData.companyStage &&
      formData.fundingAmount &&
      formData.message &&
      wordCount <= 100 &&
      charCount <= 600;

    if (formData.category === 'Other') {
      return baseValidation && formData.customCategory.trim() !== '';
    }

    return baseValidation;
  };

  // Swipe functionality
  const handleTouchStart = (e) => {
    if (!isMobile || !isFormValid() || isSubmitted) return;

    setIsDragging(true);
    startXRef.current = e.touches[0].clientX;
  };

  const handleMouseDown = (e) => {
    if (!isMobile || !isFormValid() || isSubmitted) return;

    setIsDragging(true);
    startXRef.current = e.clientX;
  };

  const handleTouchMove = (e) => {
    if (!isDragging || !buttonRef.current) return;

    const currentX = e.touches[0].clientX;
    const buttonWidth = buttonRef.current.offsetWidth;
    const arrowWidth = 48; // 3rem
    const maxDrag = buttonWidth - arrowWidth - 8; // 8px margin

    let newPosition = currentX - startXRef.current;
    newPosition = Math.max(0, Math.min(newPosition, maxDrag));

    dragPositionRef.current = newPosition;
    setVisualPosition(newPosition);
  };

  const handleMouseMove = (e) => {
    if (!isDragging || !buttonRef.current) return;

    const currentX = e.clientX;
    const buttonWidth = buttonRef.current.offsetWidth;
    const arrowWidth = 48; // 3rem
    const maxDrag = buttonWidth - arrowWidth - 8;

    let newPosition = currentX - startXRef.current;
    newPosition = Math.max(0, Math.min(newPosition, maxDrag));

    dragPositionRef.current = newPosition;
    setVisualPosition(newPosition);
  };

  const handleDragEnd = async () => {
    if (!isDragging) return;

    const buttonWidth = buttonRef.current?.offsetWidth || 0;
    const threshold = buttonWidth * 0.7;

    if (dragPositionRef.current >= threshold && isFormValid()) {
      // Submit via API
      await submitToAPI();
    }

    // Reset
    setIsDragging(false);
    dragPositionRef.current = 0;
    setVisualPosition(0);
  };

  // Add mouse/touch event listeners
  useEffect(() => {
    if (isMobile && isDragging) {
      document.addEventListener('touchmove', handleTouchMove, { passive: false });
      document.addEventListener('touchend', handleDragEnd);
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleDragEnd);

      return () => {
        document.removeEventListener('touchmove', handleTouchMove);
        document.removeEventListener('touchend', handleDragEnd);
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleDragEnd);
      };
    }
  }, [isMobile, isDragging]);

  return (
    <div className={styles.formContainer}>
      {/* Left Panel */}
      <div className={styles.leftPanel}>
        <HeaderFlex title="Get in touch" color="black" desktopMaxWidth={'65%'} mobileMinHeight={'8rem'} />
        <div className={styles.infoText}>
          <p>Looking to pitch to us? Fill the form out and we'll get back.</p>
          <p>Check our FAQs to know more about our process.</p>
        </div>

        <a href="#faq" className={styles.faqLink}>
          Jump to FAQ
          <span className={styles.arrow}>↓</span>
        </a>
      </div>

      {/* Right Panel - Form */}
      <div className={styles.rightPanel}>
        <form onSubmit={handleSubmit}>
          {/* Honeypot Field - Hidden from users, visible to bots */}
          <input
            type="text"
            name="website"
            value={honeypot}
            onChange={(e) => setHoneypot(e.target.value)}
            style={{ display: 'none' }}
            tabIndex="-1"
            autoComplete="off"
            aria-hidden="true"
          />

          {/* Name and Company Name Row */}
          <div className={styles.formRow}>
            <div className={styles.formField}>
              <label htmlFor="name">
                Your name<span className={styles.required}>*</span>
              </label>
              <input
                type="text"
                id="name"
                name="name"
                placeholder="Name and surname"
                value={formData.name}
                onChange={handleInputChange}
                disabled={isSubmitted || isSubmitting || isBlocked}
                required
              />
            </div>

            <div className={styles.formField}>
              <label htmlFor="companyName">
                Company name<span className={styles.required}>*</span>
              </label>
              <input
                type="text"
                id="companyName"
                name="companyName"
                placeholder="Official or working name"
                value={formData.companyName}
                onChange={handleInputChange}
                disabled={isSubmitted || isSubmitting || isBlocked}
                required
              />
            </div>
          </div>

          {/* Email */}
          <div className={styles.formField}>
            <label htmlFor="email">
              Email<span className={styles.required}>*</span>
            </label>
            <input
              type="email"
              id="email"
              name="email"
              placeholder="Enter your email address here"
              value={formData.email}
              onChange={handleInputChange}
              onBlur={handleEmailBlur}
              disabled={isSubmitted || isSubmitting || isBlocked}
              required
            />
            {emailError && <p className={styles.errorText}>{emailError}</p>}
          </div>

          {/* Category Dropdown */}
          <div className={styles.formField}>
            <label htmlFor="category">
              Category<span className={styles.required}>*</span>
            </label>
            <select
              id="category"
              name="category"
              value={formData.category}
              onChange={handleInputChange}
              disabled={isSubmitted || isSubmitting || isBlocked}
              required
              className={formData.category === '' ? styles.placeholder : ''}
            >
              <option value="" disabled>
                Select your company's sector
              </option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {capitalizeWords(cat)}
                </option>
              ))}
            </select>
          </div>

          {/* Custom Category Field */}
          {showCustomCategory && (
            <div className={styles.formField}>
              <label htmlFor="customCategory">
                Specify your category<span className={styles.required}>*</span>
              </label>
              <input
                type="text"
                id="customCategory"
                name="customCategory"
                placeholder="Enter your sector (max 50 characters)"
                value={formData.customCategory}
                onChange={handleInputChange}
                disabled={isSubmitted || isSubmitting || isBlocked}
                maxLength={50}
                required
              />
              <div className={styles.charCounter}>{formData.customCategory.length}/50 characters</div>
            </div>
          )}

          {/* Company Stage Dropdown */}
          <div className={styles.formField}>
            <label htmlFor="companyStage">
              Company stage<span className={styles.required}>*</span>
            </label>
            <select
              id="companyStage"
              name="companyStage"
              value={formData.companyStage}
              onChange={handleInputChange}
              disabled={isSubmitted || isSubmitting || isBlocked}
              required
              className={formData.companyStage === '' ? styles.placeholder : ''}
            >
              <option value="" disabled>
                Select your company's funding stage
              </option>
              <option value="Pre-seed">Pre-seed</option>
              <option value="Seed">Seed</option>
              <option value="Series A">Series A</option>
              <option value="Series B">Series B</option>
              <option value="Series C">Series C</option>
              <option value="Series D+">Series D+</option>
              <option value="Growth Stage">Growth Stage</option>
              <option value="Bridge Round">Bridge Round</option>
            </select>
          </div>

          {/* Funding Amount */}
          <div className={styles.formField}>
            <label htmlFor="fundingAmount">
              Desired amount of funding (INR)<span className={styles.required}>*</span>
            </label>
            <input
              type="number"
              id="fundingAmount"
              name="fundingAmount"
              placeholder="Enter numbers only"
              value={formData.fundingAmount}
              onChange={handleInputChange}
              disabled={isSubmitted || isSubmitting || isBlocked}
              required
            />
          </div>

          {/* Message Textarea */}
          <div className={styles.formField}>
            <label htmlFor="message">
              Your message<span className={styles.required}>*</span>
            </label>
            <textarea
              id="message"
              name="message"
              placeholder="Your pitch in 100 words or less"
              value={formData.message}
              onChange={handleInputChange}
              disabled={isSubmitted || isSubmitting || isBlocked}
              required
              rows={5}
            />
            <div className={styles.charCounter}>
              {wordCount > 0 || charCount > 0
                ? `${wordCount}/100 words or ${charCount}/600 characters`
                : '100 words or 600 characters'}
            </div>
          </div>

          {/* Submit Button OR Success/Rejection Message */}
          {isSubmitted ? (
            // Success message (green)
            <div className={styles.successMessage}>
              ✓ Thank you! Your pitch has been submitted. We'll contact you at <strong>{submittedEmail}</strong> if we
              proceed with your application.
            </div>
          ) : isBlocked ? (
            // Rejection message (red)
            <div
              style={{
                padding: '20px',
                border: '1px solid #363636',
                textAlign: 'center',
                color: '#d30000',
                fontSize: '16px',
                fontWeight: '300',
              }}
            >
              Your entry was blocked due to invalid credentials.
            </div>
          ) : (
            // Submit button
            <button
              ref={buttonRef}
              type={isMobile ? 'button' : 'submit'}
              className={styles.submitButton}
              disabled={!isFormValid() || isSubmitting}
              onTouchStart={handleTouchStart}
              onMouseDown={handleMouseDown}
            >
              <span className={styles.buttonText}>
                {isSubmitting ? 'Submitting...' : isMobile && isFormValid() ? 'Swipe to submit' : 'Submit'}
              </span>
              <span
                className={styles.arrowBox}
                style={
                  isMobile
                    ? {
                        transform: `translateX(${visualPosition}px)`,
                        transition: isDragging ? 'none' : 'transform 0.3s ease',
                      }
                    : {}
                }
              >
                <RightArrowSlideIcon />
              </span>
            </button>
          )}

          {(wordCount > 100 || charCount > 600) && (
            <p className={styles.errorText}>Ensure your message is no more than 100 words or 600 characters</p>
          )}
        </form>
      </div>
    </div>
  );
}
