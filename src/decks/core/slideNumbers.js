// Which slide types carry a page number, and on what ground. Mirrors the
// legacy SKIP list (cover `s1`, dividers `s3-div`/`fi-div`) and its
// "bg-crimson → light number" rule: the closing slide is crimson and IS
// numbered. Everything else is a light slide. Numbers are 1-based over the
// whole deck (dividers count, they just don't show one).
export const SLIDE_NUMBER_MODE = {
  cover: 'skip',
  'section-divider': 'skip',
  closing: 'dark',
  logomark: 'dark',
  'person-grid': 'dark', // crimson ground
  'portfolio-support': 'dark', // number sits on the full-width crimson banner
  title: 'skip', // legacy s-fii-blank is in the SKIP list
};

// Slides that are dark only at the bottom edge (the number turns light, the
// section breadcrumb up top stays crimson).
export const CRIMSON_BAND_ONLY = new Set(['portfolio-support']);

export const slideNumberMode = (type) => SLIDE_NUMBER_MODE[type] || 'light';

// Slides that never show the section breadcrumb (legacy `skipClasses` + the
// dividers themselves, which are the section heads).
const NO_BREADCRUMB = new Set(['cover', 'contents', 'closing', 'section-divider']);

// Sets `.section` on each slide from the most recent slide that opened one
// (`sectionStart`), skipping types that don't show a breadcrumb and the
// section-opening slide itself.
export function assignSections(slides) {
  let current = null;
  return slides.map((s) => {
    if (s.sectionStart) {
      current = s.sectionStart;
      return s;
    }
    return NO_BREADCRUMB.has(s.type) || !current ? s : { ...s, section: current };
  });
}
