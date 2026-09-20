// Output formats. A format fixes the canvas and the rules that come with it;
// nothing about size, safe margins or block availability is left to the asset
// author (human or AI). `w`/`h` are CSS px; `h: null` = height follows content
// (email). Type sizes in a brand are defined at a 1080px reference width and
// scaled by `w / 1080`, so the same roles work on every canvas. `safe` (and
// safeTop/safeBottom) are in the same reference px, scaled the same way.
const ALL_BLOCKS = ['stack', 'grid', 'layer', 'text', 'image', 'shape', 'logo', 'spacer', 'divider', 'button', 'list', 'stat', 'pattern'];
const EMAIL_BLOCKS = ['stack', 'grid', 'text', 'image', 'logo', 'spacer', 'divider', 'button', 'list', 'stat'];

export const FORMATS = {
  'linkedin-square': { label: 'LinkedIn carousel · 1:1', kind: 'pages', w: 1080, h: 1080, safe: 72, minPages: 1, maxPages: 20, blocks: ALL_BLOCKS, outputs: ['png', 'pdf'] },
  'linkedin-portrait': { label: 'LinkedIn carousel · 4:5', kind: 'pages', w: 1080, h: 1350, safe: 72, minPages: 1, maxPages: 20, blocks: ALL_BLOCKS, outputs: ['png', 'pdf'] },
  story: { label: 'Story · 9:16', kind: 'pages', w: 1080, h: 1920, safe: 72, safeTop: 200, safeBottom: 280, minPages: 1, maxPages: 10, blocks: ALL_BLOCKS, outputs: ['png'] },
  'og-image': { label: 'Link preview · 1.91:1', kind: 'pages', w: 1200, h: 630, safe: 56, minPages: 1, maxPages: 1, blocks: ALL_BLOCKS, outputs: ['png'] },
  slide: { label: 'Slide · 16:9', kind: 'pages', w: 1920, h: 1080, safe: 96, minPages: 1, maxPages: 40, blocks: ALL_BLOCKS, outputs: ['pdf', 'png'] },
  'a4-portrait': { label: 'A4 page', kind: 'pages', w: 794, h: 1123, safe: 56, minPages: 1, maxPages: 12, blocks: ALL_BLOCKS, outputs: ['pdf'] },
  // Email: one continuous column, table-based output, so no absolute layout
  // (layer / pattern / shape) and shallower nesting.
  email: { label: 'Emailer · 600px', kind: 'email', w: 600, h: null, safe: 24, minPages: 1, maxPages: 1, blocks: EMAIL_BLOCKS, maxDepth: 4, maxGridColumns: 2, outputs: ['html'] },
};

export const formatScale = (format) => (format.kind === 'email' ? 1 : format.w / 1080);
