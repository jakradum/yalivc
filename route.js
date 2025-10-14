import { NextResponse } from 'next/server';

// Simple in-memory rate limiting (resets on server restart)
// For production, use Redis or similar
const submissionCache = new Map();
const RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 hour in milliseconds

function isRateLimited(email) {
  const now = Date.now();
  const lastSubmission = submissionCache.get(email);
  
  if (lastSubmission && now - lastSubmission < RATE_LIMIT_WINDOW) {
    return true;
  }
  
  return false;
}

function recordSubmission(email) {
  submissionCache.set(email, Date.now());
  
  // Clean up old entries (older than rate limit window)
  const cutoff = Date.now() - RATE_LIMIT_WINDOW;
  for (const [key, value] of submissionCache.entries()) {
    if (value < cutoff) {
      submissionCache.delete(key);
    }
  }
}

export async function POST(request) {
  try {
    const { name, email, company, pitch } = await request.json();

    // Validation
    if (!name || !email || !company || !pitch) {
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

    // Pitch length validation (max 700 chars, ~100 words)
    if (pitch.length > 700) {
      return NextResponse.json(
        { error: 'Pitch must be 700 characters or less' },
        { status: 400 }
      );
    }

    // Rate limiting
    if (isRateLimited(email)) {
      return NextResponse.json(
        { error: 'You have already submitted an application recently. Please try again later.' },
        { status: 429 }
      );
    }

    // Airtable API call
    const airtableApiKey = process.env.AIRTABLE_API_KEY;
    const airtableBaseId = process.env.AIRTABLE_BASE_ID;
    const airtableTableName = process.env.AIRTABLE_TABLE_NAME || 'Opportunities';

    if (!airtableApiKey || !airtableBaseId) {
      console.error('Missing Airtable credentials');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    const airtableUrl = `https://api.airtable.com/v0/${airtableBaseId}/${airtableTableName}`;

    const airtableResponse = await fetch(airtableUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${airtableApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        fields: {
          'Name': name,
          'Email': email,
          'Company': company,
          'Pitch': pitch,
          'Deal Stage': 'New'
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

    // Record successful submission for rate limiting
    recordSubmission(email);

    // TODO Phase 2A: Trigger auto-reply email via Resend

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
