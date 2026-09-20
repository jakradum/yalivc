// Example assets. They exist to (a) show what a valid asset looks like — a
// starting point the AI can be pointed at — and (b) exercise the validator and
// renderers. Content uses only facts already in the Fund II deck; stat blocks
// carry their provenance.
const t = (id, role, text, color, extra = {}) => ({ type: 'text', id, role, text, color, ...extra });

export const carousel = {
  schema: 'creative/1',
  id: 'example-carousel',
  title: 'Fund II — LinkedIn carousel (example)',
  format: 'linkedin-square',
  brand: 'yali',
  pages: [
    {
      id: 'cover',
      background: 'crimson',
      root: {
        type: 'stack', id: 'cover-root', direction: 'column', gap: 'm', justify: 'end',
        children: [
          { type: 'layer', id: 'cover-art', ratio: 'fill', children: [
            { type: 'pattern', id: 'cover-pat', name: 5, color: 'gold', opacity: 0.3 },
            { type: 'stack', id: 'cover-copy', anchor: 'bottom', direction: 'column', gap: 'm', children: [
              t('cover-eyebrow', 'eyebrow', 'A deep tech fund', 'gold'),
              t('cover-title', 'display', 'Yali Capital\nFund ==II==', 'white'),
              { type: 'shape', id: 'cover-bar', kind: 'bar', color: 'gold', size: 'm' },
            ] },
          ] },
          { type: 'logo', id: 'cover-logo', variant: 'mark', tone: 'dark', size: 'm' },
        ],
      },
    },
    {
      id: 'size',
      background: 'light',
      root: {
        type: 'stack', id: 'size-root', direction: 'column', gap: 'l', justify: 'center',
        children: [
          t('size-eyebrow', 'eyebrow', 'Fund II · Target size', 'crimson'),
          { type: 'stat', id: 'size-stat', value: '₹1,800 Cr', label: 'Target fund size (~$200M)', source: 'sanity:fund2Settings.targetFundSizeINR', color: 'crimson' },
          { type: 'divider', id: 'size-rule', color: 'ink' },
          t('size-body', 'body', 'Term of 10 + 1 + 1 years, with a four-year investment period.', 'ink'),
        ],
      },
    },
    {
      id: 'sectors',
      background: 'white',
      root: {
        type: 'stack', id: 'sectors-root', direction: 'column', gap: 'l', justify: 'center',
        children: [
          t('sectors-eyebrow', 'eyebrow', 'Where we invest', 'crimson'),
          t('sectors-title', 'title', 'Six core sectors', 'ink'),
          { type: 'list', id: 'sectors-list', marker: 'dash', role: 'body', color: 'ink', items: ['Life Sciences', 'Smart Manufacturing', 'Fabless Semiconductor', 'Artificial Intelligence', 'Robotics', 'Aerospace & Surveillance'] },
        ],
      },
    },
    {
      id: 'stages',
      background: 'light',
      root: {
        type: 'stack', id: 'stages-root', direction: 'column', gap: 'l', justify: 'center',
        children: [
          t('stages-eyebrow', 'eyebrow', 'How Fund II deploys', 'crimson'),
          t('stages-title', 'heading', 'Stage agnostic, with a seed core', 'ink'),
          { type: 'grid', id: 'stages-grid', columns: 2, gap: 'l', children: [
            { type: 'stat', id: 'stage-seed', value: '10%', label: 'Seed: initial stage', source: 'sanity:fund2Settings.deploymentStageAllocation', color: 'crimson' },
            { type: 'stat', id: 'stage-agn', value: '90%', label: 'Stage agnostic: all stages', source: 'sanity:fund2Settings.deploymentStageAllocation', color: 'crimson' },
          ] },
        ],
      },
    },
    {
      id: 'cta',
      background: 'crimson',
      root: {
        type: 'stack', id: 'cta-root', direction: 'column', gap: 'l', justify: 'center',
        children: [
          t('cta-title', 'title', 'Learn more about ==Fund II==', 'white'),
          { type: 'button', id: 'cta-btn', label: 'yali.vc', href: 'https://yali.vc', style: 'solid', color: 'gold' },
          { type: 'spacer', id: 'cta-space', size: 'xl' },
          { type: 'logo', id: 'cta-logo', variant: 'mark', tone: 'dark', size: 'm' },
        ],
      },
    },
  ],
};

export const emailer = {
  schema: 'creative/1',
  id: 'example-email',
  title: 'Fund II — emailer (example)',
  format: 'email',
  brand: 'yali',
  pages: [
    {
      id: 'mail',
      background: 'white',
      root: {
        type: 'stack', id: 'mail-root', direction: 'column', gap: 'l',
        children: [
          { type: 'logo', id: 'mail-logo', variant: 'lockup', tone: 'light', size: 'm' },
          { type: 'divider', id: 'mail-rule', color: 'crimson', weight: 'medium' },
          t('mail-eyebrow', 'eyebrow', 'Fund II', 'crimson'),
          t('mail-title', 'title', 'A deep tech fund for India', 'ink'),
          t('mail-body', 'body', 'Yali Capital Fund II targets ₹1,800 Crore (~$200M) to back deep tech companies across six sectors.', 'ink'),
          { type: 'grid', id: 'mail-stats', columns: 2, gap: 'm', children: [
            { type: 'stat', id: 'mail-size', value: '₹1,800 Cr', label: 'Target fund size', source: 'sanity:fund2Settings.targetFundSizeINR', color: 'crimson' },
            { type: 'stat', id: 'mail-term', value: '10 + 1 + 1', label: 'Fund term (years)', source: 'sanity:fund2Settings.fundTerm', color: 'crimson' },
          ] },
          { type: 'button', id: 'mail-btn', label: 'Read more', href: 'https://yali.vc', style: 'solid', color: 'crimson' },
          { type: 'divider', id: 'mail-rule2', color: 'ink' },
          t('mail-foot', 'caption', 'Yali Capital · yali.vc', 'ink'),
        ],
      },
    },
  ],
};

export const FIXTURES = { carousel, emailer };

import { portrait, story, ogImage, slide, a4, roundup, news, spotlight } from './samples.js';
FIXTURES.portrait = portrait;
FIXTURES.story = story;
FIXTURES.ogImage = ogImage;
FIXTURES.slide = slide;
FIXTURES.a4 = a4;
FIXTURES.roundup = roundup;
FIXTURES.news = news;
FIXTURES.spotlight = spotlight;
