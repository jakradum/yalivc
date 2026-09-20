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
    light: '#efefef', // the ground of every past LinkedIn asset (the deck's #eeeceb is deck-only)
    black: '#1a1a1a', // roundup cover ground
    grey: '#6b6b6b', // body grey on light (AA; the old #888 is 3:1)
    silver: '#b8b8b8', // body grey on ink/black/crimson
    white: '#ffffff',
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
    display: { font: 'mono', size: 120, weight: 700, lh: 1.02, ls: -0.02, large: true, email: 34 }, // roundup cover: 128px in the originals
    title: { font: 'mono', size: 64, weight: 700, lh: 1.12, ls: 0, large: true, email: 28 },
    heading: { font: 'mono', size: 54, weight: 700, lh: 1.12, ls: 0, large: true, email: 22 }, // the carousels' h2: 54–58px
    headline: { font: 'body', size: 40, weight: 700, lh: 1.2, ls: -0.015, large: true, email: 22 }, // portfolio-news posts: Inter 700
    subhead: { font: 'body', size: 32, weight: 400, lh: 1.35, ls: 0, large: true, email: 18 },
    body: { font: 'body', size: 30, weight: 400, lh: 1.5, ls: 0, large: false, email: 16 },
    caption: { font: 'body', size: 22, weight: 400, lh: 1.45, ls: 0, large: false, email: 13 },
    eyebrow: { font: 'mono', size: 22, weight: 700, lh: 1.2, ls: 0.18, upper: true, large: false, email: 11 },
    note: { font: 'mono', size: 20, weight: 400, lh: 1.6, ls: 0, large: false, email: 14 }, // the carousels' paragraph: mono 20px
    micro: { font: 'mono', size: 15, weight: 400, lh: 1.3, ls: 0.16, upper: true, large: false, email: 10 }, // footers, credits, "L-R:" lines
    stat: { font: 'mono', size: 132, weight: 700, lh: 1, ls: 0, large: true, email: 44 },
    figure: { font: 'mono', size: 72, weight: 700, lh: 1, ls: 0, large: true, email: 30 }, // the `medium` stat size
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
  // House rule (docs/CLAUDE.md): no rounded corners on any box. `full` exists only for round avatars.
  radius: { none: 0, full: 9999 },

  // Where things may point.
  images: { sanityPrefix: 'https://cdn.sanity.io/images/nt0wmty3/', library: {
      mark: '/favicon.svg',
      lockup: '/brand/yali-lockup.png',
      // Synthetic placeholders so sample layouts can show a photo without using anyone's picture.
      'sample-wide': '/brand/samples/photo-wide.jpg',
      'sample-portrait': '/brand/samples/photo-portrait.jpg',
      'sample-group': '/brand/samples/photo-group.jpg',
    },
  },
  linkHosts: ['yali.vc', 'www.yali.vc', 'linkedin.com', 'www.linkedin.com'],

  // Read by the AI (system prompt), not enforced by code.
  voice: [
    'Plain, precise, confident. Short sentences. No hype words ("revolutionary", "game-changing").',
    'Deep tech investing (India-focused): specifics beat adjectives.',
    'No icons or emoji. Structure comes from type hierarchy, rules and colour blocks.',
    'Crimson and gold are the brand; ink text on light grounds; white text on crimson.',
    'NEVER use em dashes in visible text. Use a colon, comma or semicolon instead.',
    'Copy conventions from past posts: eyebrow like "PORTFOLIO NEWS" or "PORTFOLIO · C2I SEMICONDUCTORS"; "L-R: name, name" under group photos; sign off with "yali.vc"; "A Yali Capital portfolio company" on portfolio-company assets.',
  ],
};
