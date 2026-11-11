// Company logos at an even visual size (Pranav, 11 Nov 2026).
//
// Each company record carries `logoCrop` (the logo's visible edges, in source pixels);
// the readers turn it into a Sanity CDN `rect=` crop on the logo URL. Here the logo is
// sized by area rather than by box, so a wide mark (C2i, mp) and a tall one (DeepLASE)
// look the same size: width x height = side², at the logo's own shape.

const CDN = 'https://cdn.sanity.io/';

// The logo URL with its crop applied, from a Sanity image URL and a { x, y, w, h } crop.
export function croppedLogoUrl(url, crop) {
  if (!url || !crop || !url.startsWith(CDN)) return url;
  const { x, y, w, h } = crop;
  if (![x, y, w, h].every(Number.isFinite) || w <= 0 || h <= 0) return url;
  return `${url}${url.includes('?') ? '&' : '?'}rect=${x},${y},${w},${h}`;
}

// The URL to load at `px` pixels wide (twice the display size, for sharp screens).
export function logoSrc(url, px) {
  if (!url || !url.startsWith(CDN)) return url;
  return `${url}${url.includes('?') ? '&' : '?'}w=${px}&fm=png`;
}

// Width and height (CSS px) for a logo with the visual area of a `side` x `side` square,
// capped at `maxW` x `maxH`. Shape comes from the crop, else from the file's own size.
export function logoBox(url, side, { maxW = side * 1.6, maxH = side * 1.2 } = {}) {
  const ratio = logoAspect(url);
  if (!ratio) return { width: side, height: side };
  let width = side * Math.sqrt(ratio);
  let height = side / Math.sqrt(ratio);
  const shrink = Math.min(1, maxW / width, maxH / height);
  width *= shrink;
  height *= shrink;
  return { width: Math.round(width), height: Math.round(height) };
}

function logoAspect(url) {
  if (!url) return null;
  const rect = url.match(/[?&]rect=\d+,\d+,(\d+),(\d+)/);
  if (rect) return Number(rect[1]) / Number(rect[2]);
  const size = url.match(/-(\d+)x(\d+)\.[a-z]+(\?|$)/i);
  return size ? Number(size[1]) / Number(size[2]) : null;
}
