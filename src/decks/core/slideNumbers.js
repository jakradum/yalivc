// Which slide types carry a page number, and on what ground. Mirrors the
// legacy SKIP list (cover `s1`, dividers `s3-div`/`fi-div`) and its
// "bg-crimson → light number" rule: the closing slide is crimson and IS
// numbered. Everything else is a light slide. Numbers are 1-based over the
// whole deck (dividers count, they just don't show one).
export const SLIDE_NUMBER_MODE = {
  cover: 'skip',
  'section-divider': 'skip',
  closing: 'dark',
};

export const slideNumberMode = (type) => SLIDE_NUMBER_MODE[type] || 'light';
