// One hand-built sample per format, from facts already in the Fund II deck.
// They show what each format looks like when built — and are valid starting
// points the AI can be told to adapt. (Facts: fund size ₹1,800 Cr / ~$200M,
// greenshoe ₹300 Cr, term 10+1+1, 4-year investment period, Seed 10% / stage
// agnostic 90%, six core + four adjacent sectors, seven Fund I companies.)
const t = (id, role, text, color, extra = {}) => ({ type: 'text', id, role, text, color, ...extra });
const stat = (id, value, label, source, color = 'crimson', extra = {}) => ({ type: 'stat', id, value, label, source, color, ...extra });
const page = (id, background, root) => ({ id, background, root: { type: 'stack', id: `${id}-root`, direction: 'column', gap: 'm', ...root } });
const SRC = 'sanity:fund2Settings';

export const portrait = {
  schema: 'creative/1', id: 'sample-portrait', title: 'LinkedIn 4:5 — sector spotlight', format: 'linkedin-portrait', brand: 'yali',
  pages: [
    page('p1', 'crimson', { justify: 'end', gap: 'l', children: [
      { type: 'layer', id: 'p1-art', ratio: 'fill', children: [
        { type: 'pattern', id: 'p1-pat', name: 3, color: 'gold', opacity: 0.3 },
        { type: 'stack', id: 'p1-copy', anchor: 'bottom', direction: 'column', gap: 'm', children: [
          t('p1-eb', 'eyebrow', 'Fund II · Sectors', 'gold'),
          t('p1-t', 'display', 'Six core\nsectors.\nFour more\nin sight.', 'white'),
        ] },
      ] },
      { type: 'shape', id: 'p1-bar', kind: 'bar', color: 'gold', size: 'm' },
    ] }),
    page('p2', 'white', { justify: 'center', gap: 'l', children: [
      t('p2-eb', 'eyebrow', 'Core', 'crimson'),
      t('p2-t', 'title', 'Where we invest today', 'ink'),
      { type: 'list', id: 'p2-l', marker: 'dash', role: 'body', color: 'ink', items: ['Life Sciences', 'Smart Manufacturing', 'Fabless Semiconductor', 'Artificial Intelligence', 'Robotics', 'Aerospace & Surveillance'] },
      { type: 'divider', id: 'p2-d', color: 'crimson' },
      t('p2-eb2', 'eyebrow', 'Adjacent', 'crimson'),
      t('p2-a', 'body', 'Space Tech · Quantum · Energy · Advanced Materials', 'ink'),
    ] }),
  ],
};

export const story = {
  schema: 'creative/1', id: 'sample-story', title: 'Story — Fund II in numbers', format: 'story', brand: 'yali',
  pages: [
    page('s1', 'crimson', { justify: 'center', gap: 'l', children: [
      { type: 'layer', id: 's1-art', ratio: 'fill', children: [
        { type: 'pattern', id: 's1-pat', name: 2, color: 'gold', opacity: 0.3 },
        { type: 'stack', id: 's1-copy', anchor: 'center', direction: 'column', gap: 'l', align: 'center', children: [
          t('s1-eb', 'eyebrow', 'A deep tech fund', 'gold', { align: 'center' }),
          t('s1-t', 'display', 'Yali Capital\nFund ==II==', 'white', { align: 'center' }),
        ] },
      ] },
    ] }),
    page('s2', 'light', { justify: 'center', gap: 'xl', children: [
      stat('s2-a', '₹1,800 Cr', 'Target fund size (~$200M)', `${SRC}.targetFundSizeINR`, 'crimson', { align: 'center' }),
      { type: 'divider', id: 's2-d', color: 'ink' },
      stat('s2-b', '10+1+1', 'Fund term, years', `${SRC}.fundTerm`, 'crimson', { align: 'center' }),
      { type: 'divider', id: 's2-d2', color: 'ink' },
      stat('s2-c', '4 yrs', 'Investment period', `${SRC}.investmentPeriodYears`, 'crimson', { align: 'center' }),
    ] }),
  ],
};

export const ogImage = {
  schema: 'creative/1', id: 'sample-og', title: 'Link preview — Fund II', format: 'og-image', brand: 'yali',
  pages: [
    page('og', 'crimson', { direction: 'row', gap: 'xl', align: 'center', children: [
      { type: 'stack', id: 'og-l', direction: 'column', gap: 'm', grow: true, children: [
        t('og-eb', 'eyebrow', 'A deep tech fund', 'gold'),
        t('og-t', 'title', 'Yali Capital Fund ==II==', 'white'),
        t('og-b', 'body', 'Backing deep tech companies across six sectors.', 'white'),
      ] },
      { type: 'logo', id: 'og-logo', variant: 'mark', tone: 'dark', size: 'l' },
    ] }),
  ],
};

export const slide = {
  schema: 'creative/1', id: 'sample-slide', title: 'Slides — how a pitch flows', format: 'slide', brand: 'yali',
  pages: [
    page('sl1', 'crimson', { justify: 'center', gap: 'l', children: [
      t('sl1-eb', 'eyebrow', 'Our process', 'gold'),
      t('sl1-t', 'display', 'From inbound\nto portfolio', 'white'),
      { type: 'shape', id: 'sl1-bar', kind: 'bar', color: 'gold', size: 'l' },
    ] }),
    page('sl2', 'light', { justify: 'center', gap: 'm', children: [
      t('sl2-t', 'heading', 'Six steps before an investment', 'ink'),
      { type: 'grid', id: 'sl2-g', columns: 3, gap: 'l', children: [
        { type: 'stack', id: 'sl2-1', direction: 'column', gap: 's', fill: 'white', padding: 'm', children: [t('sl2-1e', 'eyebrow', '01', 'crimson'), t('sl2-1t', 'subhead', 'AI inbox', 'ink')] },
        { type: 'stack', id: 'sl2-2', direction: 'column', gap: 's', fill: 'white', padding: 'm', children: [t('sl2-2e', 'eyebrow', '02', 'crimson'), t('sl2-2t', 'subhead', 'Team vet', 'ink')] },
        { type: 'stack', id: 'sl2-3', direction: 'column', gap: 's', fill: 'white', padding: 'm', children: [t('sl2-3e', 'eyebrow', '03', 'crimson'), t('sl2-3t', 'subhead', 'Initial meeting', 'ink')] },
        { type: 'stack', id: 'sl2-4', direction: 'column', gap: 's', fill: 'white', padding: 'm', children: [t('sl2-4e', 'eyebrow', '04', 'crimson'), t('sl2-4t', 'subhead', 'Internal review', 'ink')] },
        { type: 'stack', id: 'sl2-5', direction: 'column', gap: 's', fill: 'white', padding: 'm', children: [t('sl2-5e', 'eyebrow', '05', 'crimson'), t('sl2-5t', 'subhead', 'Pitch', 'ink')] },
        { type: 'stack', id: 'sl2-6', direction: 'column', gap: 's', fill: 'crimson', padding: 'm', children: [t('sl2-6e', 'eyebrow', '06', 'gold'), t('sl2-6t', 'subhead', 'Follow-on meeting', 'white')] },
      ] },
    ] }),
  ],
};

export const a4 = {
  schema: 'creative/1', id: 'sample-a4', title: 'A4 — Fund II fact sheet', format: 'a4-portrait', brand: 'yali',
  pages: [
    page('a4', 'white', { gap: 'l', children: [
      { type: 'stack', id: 'a4-head', direction: 'row', justify: 'between', align: 'center', children: [
        { type: 'logo', id: 'a4-logo', variant: 'lockup', tone: 'light', size: 'm' },
        t('a4-eb', 'eyebrow', 'Fact sheet', 'crimson'),
      ] },
      { type: 'divider', id: 'a4-r1', color: 'crimson', weight: 'medium' },
      t('a4-t', 'title', 'Yali Capital Fund II', 'ink'),
      t('a4-s', 'subhead', 'A deep tech fund', 'ink'),
      { type: 'grid', id: 'a4-g', columns: 2, gap: 'l', children: [
        stat('a4-1', '₹1,800 Cr', 'Target fund size (~$200M)', `${SRC}.targetFundSizeINR`, 'crimson', { size: 'medium' }),
        stat('a4-2', '₹300 Cr', 'Greenshoe', `${SRC}.greenshoeINR`, 'crimson', { size: 'medium' }),
        stat('a4-3', '10+1+1', 'Fund term, years', `${SRC}.fundTerm`, 'crimson', { size: 'medium' }),
        stat('a4-4', '4 yrs', 'Investment period', `${SRC}.investmentPeriodYears`, 'crimson', { size: 'medium' }),
      ] },
      { type: 'divider', id: 'a4-r2', color: 'ink' },
      t('a4-h', 'heading', 'Deployment', 'ink'),
      t('a4-b', 'body', 'Seed 10% (initial stage). Stage agnostic 90% (all stages).', 'ink'),
    ] }),
  ],
};

export const SAMPLES = [
  { key: 'roundup', label: 'LinkedIn roundup carousel · 1:1 (house style)' },
  { key: 'news', label: 'Portfolio news post · 1:1 (house style)' },
  { key: 'spotlight', label: 'Guest spotlight card · 1:1 (house style)' },
  { key: 'carousel', label: 'LinkedIn carousel · 1:1 (Fund II facts)' },
  { key: 'portrait', label: 'LinkedIn carousel · 4:5' },
  { key: 'story', label: 'Story · 9:16' },
  { key: 'ogImage', label: 'Link preview · 1.91:1' },
  { key: 'slide', label: 'Slides · 16:9' },
  { key: 'a4', label: 'A4 page' },
  { key: 'emailer', label: 'Emailer · 600px' },
];

// ── House-style samples: faithful re-creations of Yali's real past assets
// (see recipes.js). Photos are synthetic placeholders and the copy is plainly
// placeholder text: they show LAYOUT, not content.
const img = (id, key, extra = {}) => ({ type: 'image', id, src: { kind: 'library', key }, alt: 'Placeholder photo', tone: 'house', ...extra });
const bleedPage = (id, background, root) => ({ id, background, bleed: true, root: { type: 'stack', id: `${id}-root`, direction: 'column', gap: 'none', ...root } });
const textStack = (id, kids, extra = {}) => ({ type: 'stack', id, direction: 'column', gap: 'm', padding: 'xl', grow: true, ...extra, children: kids });

export const roundup = {
  schema: 'creative/1', id: 'sample-roundup', title: 'LinkedIn roundup carousel (house style)', format: 'linkedin-square', brand: 'yali',
  pages: [
    // 1: cover: dimmed photo, big title
    { id: 'r1', background: 'black', bleed: true, root: { type: 'stack', id: 'r1-root', direction: 'column', gap: 'none', children: [
      { type: 'layer', id: 'r1-layer', ratio: '1:1', children: [
        img('r1-bg', 'sample-group', { tone: 'dim', anchor: 'fill', alt: '' , decorative: true }),
        { type: 'stack', id: 'r1-c', anchor: 'center', direction: 'column', gap: 'm', align: 'center', children: [
          t('r1-t', 'display', 'Roundup', 'white', { align: 'center' }),
          t('r1-s', 'heading', 'Jun ’26', 'gold', { align: 'center' }),
          { type: 'spacer', id: 'r1-sp', size: 's' },
          { type: 'logo', id: 'r1-logo', variant: 'lockup', tone: 'dark', size: 's', align: 'center' },
        ] },
      ] },
    ] } },
    // 2: photo + text (light)
    bleedPage('r2', 'light', { children: [
      img('r2-img', 'sample-wide', { ratio: '16:9' }),
      textStack('r2-txt', [
        t('r2-e', 'eyebrow', 'Speaker name (Organisation)', 'crimson'),
        t('r2-h', 'heading', 'A short headline about the conversation', 'ink'),
        t('r2-n', 'note', 'Two lines of context about what was discussed and why it mattered to the ecosystem.', 'grey'),
        t('r2-m', 'micro', 'L-R: name, name, name', 'grey'),
      ]),
      { type: 'shape', id: 'r2-band', kind: 'band', color: 'crimson' },
    ] }),
    // 3: two photos + text (ink)
    bleedPage('r3', 'ink', { children: [
      { type: 'grid', id: 'r3-g', columns: 2, gap: 'xs', children: [img('r3-a', 'sample-group', { ratio: '1:1' }), img('r3-b', 'sample-wide', { ratio: '1:1' })] },
      textStack('r3-txt', [
        t('r3-e', 'eyebrow', 'Event name', 'gold'),
        t('r3-h', 'heading', 'What the team took from the day', 'white'),
        t('r3-n', 'note', 'A quiet paragraph in silver, two to three lines, mono, no em dashes.', 'silver'),
      ]),
    ] }),
    // 4: panel (crimson)
    bleedPage('r4', 'crimson', { children: [
      { type: 'grid', id: 'r4-g', columns: 2, gap: 'xs', children: [img('r4-a', 'sample-wide', { ratio: '3:2' }), img('r4-b', 'sample-group', { ratio: '3:2' })] },
      textStack('r4-txt', [
        t('r4-e', 'eyebrow', 'Semiconductor panel', 'gold'),
        t('r4-h', 'heading', 'Scaling innovation in the ecosystem', 'white'),
        t('r4-p', 'micro', 'Panelists', 'gold'),
        { type: 'list', id: 'r4-l', marker: 'dash', role: 'note', color: 'white', items: ['Panelist One: Organisation', 'Panelist Two: Organisation', 'Moderator: Yali Capital'] },
      ], { gap: 's' }),
    ] }),
    // 5: closing
    { id: 'r5', background: 'crimson', root: { type: 'stack', id: 'r5-root', direction: 'column', gap: 'l', justify: 'center', align: 'center', children: [
      { type: 'logo', id: 'r5-logo', variant: 'mark', tone: 'dark', size: 'xl', align: 'center' },
      t('r5-t', 'heading', 'yali.vc', 'white', { align: 'center' }),
      t('r5-n', 'note', 'Follow for more updates', 'silver', { align: 'center' }),
    ] } },
  ],
};

export const news = {
  schema: 'creative/1', id: 'sample-news', title: 'Portfolio news post (house style)', format: 'linkedin-square', brand: 'yali',
  pages: [
    bleedPage('n1', 'crimson', { children: [
      { type: 'layer', id: 'n1-photo', ratio: '16:9', children: [
        img('n1-img', 'sample-wide', { anchor: 'fill' }),
        { type: 'logo', id: 'n1-mark', variant: 'lockup', tone: 'dark', size: 's', anchor: 'tl', inset: 'l' },
      ] },
      textStack('n1-panel', [
        { type: 'stack', id: 'n1-row', direction: 'row', justify: 'between', align: 'start', gap: 'm', children: [
          t('n1-e', 'eyebrow', 'Portfolio news', 'gold'),
          { type: 'stack', id: 'n1-chip', direction: 'column', fill: 'light', padding: 's', children: [{ type: 'logo', id: 'n1-co', variant: 'lockup', tone: 'light', size: 's' }] },
        ] },
        t('n1-h', 'headline', '==Company== wins Best Startup Award at Event Name 2026', 'white'),
        { type: 'stack', id: 'n1-fill', direction: 'column', gap: 'none', grow: true, children: [] },
        { type: 'divider', id: 'n1-rule', color: 'silver' },
        { type: 'stack', id: 'n1-foot', direction: 'row', justify: 'between', align: 'center', gap: 'm', children: [
          { type: 'logo', id: 'n1-foot-logo', variant: 'lockup', tone: 'dark', size: 's' },
          t('n1-url', 'micro', 'yali.vc', 'silver', { align: 'end' }),
        ] },
      ], { gap: 'm' }),
    ] }),
  ],
};

export const spotlight = {
  schema: 'creative/1', id: 'sample-spotlight', title: 'Guest spotlight card (house style)', format: 'linkedin-square', brand: 'yali',
  pages: [
    bleedPage('g1', 'black', { children: [
      { type: 'layer', id: 'g1-layer', ratio: '1:1', children: [
        img('g1-img', 'sample-portrait', { anchor: 'fill' }),
        { type: 'shape', id: 'g1-fade', kind: 'fade', color: 'black', anchor: 'fill' },
        t('g1-no', 'micro', 'Yali I - 01', 'silver', { anchor: 'tr', inset: 'l' }),
        { type: 'stack', id: 'g1-cap', anchor: 'bottom', direction: 'column', gap: 's', padding: 'xl', children: [
          { type: 'tag', id: 'g1-tag', label: 'Firm name', style: 'filled', color: 'crimson' },
          t('g1-n', 'heading', 'Guest Name', 'white'),
          t('g1-r', 'caption', 'Role, Organisation · City', 'silver'),
          t('g1-d', 'note', 'One or two lines on what the conversation covered and why it was worth having.', 'silver'),
        ] },
      ] },
    ] }),
  ],
};

export const SAMPLE_DOCS = { portrait, story, ogImage, slide, a4, roundup, news, spotlight };
