// Brand tokens — the only visual vocabulary an asset may use. Colours are
// referenced by NAME, type by ROLE, spacing by STEP; there is no way to say
// "#ff0000", "13px" or "left: 37px". A new client = a new file like this.
export const yali = {
  id: 'yali',
  name: 'Yali Capital',

  colors: {
    crimson: '#830d35',
    gold: '#ebde84',
    ink: '#363636',
    light: '#eeeceb',
    white: '#ffffff',
    muted: '#888888',
    rose: '#bb3e68',
    blush: '#f4c0d4',
  },

  // Type roles. Sizes are px at a 1080px-wide canvas (scaled per format);
  // `email` sizes are absolute px for the 600px email column.
  fonts: {
    mono: { canvas: "'JetBrains Mono', 'Inter', monospace", email: "'JetBrains Mono', 'Courier New', monospace" },
    body: { canvas: "'Inter', sans-serif", email: "Inter, Arial, Helvetica, sans-serif" },
  },
  type: {
    display: { font: 'mono', size: 96, weight: 400, lh: 1.08, ls: 0, large: true, email: 34 },
    title: { font: 'mono', size: 64, weight: 700, lh: 1.12, ls: 0, large: true, email: 28 },
    heading: { font: 'mono', size: 44, weight: 700, lh: 1.2, ls: 0, large: true, email: 22 },
    subhead: { font: 'body', size: 32, weight: 400, lh: 1.35, ls: 0, large: true, email: 18 },
    body: { font: 'body', size: 30, weight: 400, lh: 1.5, ls: 0, large: false, email: 16 },
    caption: { font: 'body', size: 22, weight: 400, lh: 1.45, ls: 0, large: false, email: 13 },
    eyebrow: { font: 'mono', size: 20, weight: 700, lh: 1.2, ls: 0.18, upper: true, large: false, email: 11 },
    stat: { font: 'mono', size: 132, weight: 700, lh: 1, ls: 0, large: true, email: 44 },
    quote: { font: 'mono', size: 48, weight: 400, lh: 1.3, ls: 0, large: true, email: 20 },
  },

  // Spacing steps (px at 1080 / px in email).
  space: {
    none: { canvas: 0, email: 0 },
    xs: { canvas: 8, email: 4 },
    s: { canvas: 16, email: 8 },
    m: { canvas: 28, email: 16 },
    l: { canvas: 44, email: 24 },
    xl: { canvas: 72, email: 40 },
    xxl: { canvas: 112, email: 56 },
  },
  radius: { none: 0, s: 8, m: 16 },

  // Where things may point.
  images: { sanityPrefix: 'https://cdn.sanity.io/images/nt0wmty3/', library: { mark: '/favicon.svg', lockup: '/brand/yali-lockup.png' } },
  linkHosts: ['yali.vc', 'www.yali.vc', 'linkedin.com', 'www.linkedin.com'],

  // Read by the AI (system prompt), not enforced by code.
  voice: [
    'Plain, precise, confident. Short sentences. No hype words ("revolutionary", "game-changing").',
    'Deep tech investing (India-focused): specifics beat adjectives.',
    'No icons or emoji. Structure comes from type hierarchy, rules and colour blocks.',
    'Crimson and gold are the brand; ink text on light grounds; white text on crimson.',
  ],
};
