import { NextResponse } from 'next/server';
import { JSDOM } from 'jsdom';
import createDOMPurify from 'dompurify';


// Rate limiting maps
const emailSubmissionCache = new Map();
const ipSubmissionCache = new Map();
const RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 hour
const window = new JSDOM('').window;
const DOMPurify = createDOMPurify(window);

// Disposable email domains to block
const DISPOSABLE_DOMAINS = [
  'tempmail.com',
  'guerrillamail.com',
  '10minutemail.com',
  'throwaway.email',
  'mailinator.com',
  'maildrop.cc',
  'temp-mail.org',
  'sharklasers.com',
  'getnada.com',
  'trashmail.com'
];

function isRateLimitedByEmail(email) {
  const now = Date.now();
  const lastSubmission = emailSubmissionCache.get(email);
  return lastSubmission && now - lastSubmission < RATE_LIMIT_WINDOW;
}

function isRateLimitedByIP(ip) {
  const now = Date.now();
  const lastSubmission = ipSubmissionCache.get(ip);
  return lastSubmission && now - lastSubmission < RATE_LIMIT_WINDOW;
}

function recordSubmission(email, ip) {
  const now = Date.now();
  emailSubmissionCache.set(email, now);
  ipSubmissionCache.set(ip, now);
  
  // Clean up old entries
  const cutoff = now - RATE_LIMIT_WINDOW;
  for (const [key, value] of emailSubmissionCache.entries()) {
    if (value < cutoff) emailSubmissionCache.delete(key);
  }
  for (const [key, value] of ipSubmissionCache.entries()) {
    if (value < cutoff) ipSubmissionCache.delete(key);
  }
}

function isDisposableEmail(email) {
  const domain = email.split('@')[1]?.toLowerCase();
  return DISPOSABLE_DOMAINS.includes(domain);
}

function sanitizeInput(input) {
  if (typeof input !== 'string') return input;
  return DOMPurify.sanitize(input, { 
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: []
  }).trim();
}

export async function POST(request) {
  try {
    // Get IP address
    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               'unknown';

    const { name, companyName, email, category, customCategory, companyStage, fundingAmount, message, honeypot } = await request.json();
    
    // Honeypot check (bot detection)
    if (honeypot) {
      console.log('Bot detected via honeypot');
      return NextResponse.json(
        { success: true },
        { status: 200 }
      );
    }
    
    // Validation
    if (!name || !companyName || !email || !category || !companyStage || !fundingAmount || !message) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }
    
    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Block disposable emails
    if (isDisposableEmail(email)) {
      return NextResponse.json(
        { error: 'Please use a permanent email address' },
        { status: 400 }
      );
    }
    
    // Message length validation
    if (message.length > 600) {
      return NextResponse.json(
        { error: 'Message must be 600 characters or less' },
        { status: 400 }
      );
    }
    
    // Rate limiting by email
    if (isRateLimitedByEmail(email)) {
      return NextResponse.json(
        { error: 'Too many submissions from this email' },
        { status: 429 }
      );
    }

    // Rate limiting by IP
    if (isRateLimitedByIP(ip)) {
      return NextResponse.json(
        { error: 'Too many submissions from this connection' },
        { status: 429 }
      );
    }
    
    // Sanitize all text inputs
    const sanitizedData = {
      name: sanitizeInput(name),
      companyName: sanitizeInput(companyName),
      email: sanitizeInput(email),
      category: sanitizeInput(category),
      customCategory: customCategory ? sanitizeInput(customCategory) : '',
      companyStage: sanitizeInput(companyStage),
      fundingAmount: sanitizeInput(fundingAmount),
      message: sanitizeInput(message)
    };

    // Airtable API call
    const airtableApiKey = process.env.AIRTABLE_API_KEY;
    const airtableBaseId = process.env.AIRTABLE_BASE_ID;
    
    if (!airtableApiKey || !airtableBaseId) {
      console.error('Missing Airtable credentials');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }
    
    const finalCategory = sanitizedData.category === 'Other' ? sanitizedData.customCategory : sanitizedData.category;
    
    const airtableUrl = `https://api.airtable.com/v0/${airtableBaseId}/Applications`;
    const airtableResponse = await fetch(airtableUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${airtableApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        fields: {
          'Name': sanitizedData.name,
          'Company Name': sanitizedData.companyName,
          'Email': sanitizedData.email,
          'Category': finalCategory,
          'Company Stage': sanitizedData.companyStage,
          'Funding Amount': sanitizedData.fundingAmount,
          'Message': sanitizedData.message,
          'Status': 'New'
        }
      })
    });
    
    if (!airtableResponse.ok) {
      const errorData = await airtableResponse.json();
      console.error('Airtable API error:', errorData);
      return NextResponse.json(
        { error: 'Failed to submit application' },
        { status: 500 }
      );
    }
    
    const airtableData = await airtableResponse.json();
    
    // Record successful submission for both email and IP
    recordSubmission(email, ip);
    
    return NextResponse.json(
      { 
        success: true,
        message: 'Application submitted successfully',
        id: airtableData.id
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Application submission error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}