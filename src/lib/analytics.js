'use client';

import { sendGAEvent } from '@next/third-parties/google';

export function trackEvent(eventName, params = {}) {
  try {
    sendGAEvent('event', eventName, params);
  } catch {
    // GA unavailable (blocked, ad blocker, etc.) — fail silently
  }
}
