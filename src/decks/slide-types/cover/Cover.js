// Pixel-matched to legacy .s1/.s1-strip/.s1-body/.s1-logo/.s1-eyebrow/
// .s1-name/.s1-sub/.s1-tag. The left strip's hex pattern (#hex-cover) is
// a third, distinct pattern bank from the team-photo and separator ones,
// ported as Honeycomb.
import { Honeycomb } from '@/decks/design-system/blocks/Honeycomb/Honeycomb';

// Fine-print watermark on every cover: deck version and the day the PDF was
// generated (`stamp`), so any copy in circulation can be traced to a version.
function CoverStamp({ version, stamp, left = 28 }) {
  const text = [version, stamp].filter(Boolean).join(' · ');
  if (!text) return null;
  return (
    <div style={{ position: 'absolute', left, bottom: 20, fontFamily: 'var(--deck-font-mono)', fontSize: 6.5, letterSpacing: '0.12em', color: 'rgba(255,255,255,0.28)', pointerEvents: 'none' }}>{text}</div>
  );
}

// `variant: 'frame'` — a bordered box with the title as a tab cut into its
// top edge (same frame-and-label grammar the sector slides use inside).
function FrameCover({ title, subtitle, eyebrow, version, stamp }) {
  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden', background: 'var(--deck-color-crimson)' }}>
      <div style={{ position: 'absolute', left: 221, right: 216, top: 269, bottom: -1, border: '1px solid var(--deck-color-light-bg)', borderBottom: 'none', boxSizing: 'border-box' }} />
      <div
        style={{
          position: 'absolute', left: '50%', top: 237, transform: 'translateX(-50%)', whiteSpace: 'nowrap',
          background: 'var(--deck-color-light-bg)', color: 'var(--deck-color-ink)', padding: '0 20px', height: 62,
          display: 'flex', alignItems: 'center', fontFamily: 'var(--deck-font-mono)', fontSize: 33, fontWeight: 400,
        }}
      >
        {title}
      </div>
      <div style={{ position: 'absolute', left: 221, right: 216, top: 319, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/favicon.svg" alt="Yali Capital" style={{ width: 34, height: 34, filter: 'brightness(0) invert(1)' }} />
        {eyebrow ? (
          <div style={{ fontFamily: 'var(--deck-font-mono)', fontSize: 9, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--deck-color-light-bg)' }}>{eyebrow}</div>
        ) : null}
        <div style={{ fontFamily: 'var(--deck-font-body)', fontSize: 13, lineHeight: 1.45, textAlign: 'center', color: 'var(--deck-color-light-bg)', maxWidth: 380 }}>{subtitle}</div>
      </div>
      <CoverStamp version={version} stamp={stamp} />
    </div>
  );
}

// `variant: 'pattern'`: the theses deck cover. Website pattern 7 (the
// diamond chain from the team profile pages) in gold on a crimson
// gradient, fading in from the right with a soft diagonal sheen, so the
// left third stays clean for the title. No eyebrow: fund name and date sit
// under the title as plain text. The monogram sits in a window cut out of
// the pattern itself: one square cell plus every cell touching it, so the
// window's edge is the pattern's own lines (the mask polygon is inset
// 0.8px to keep those lines whole). Computed once from the tile geometry
// at this scale and offset; re-derive it if either changes. Tiles are explicit paths, not an SVG
// <pattern> fill, which Chrome rasterises when it writes a PDF.
const DIAMOND = "m23.67 15 8.66-15 15.02 8.66-8.67 15.01Zm0-30 8.66 15 15.02-8.66-8.67-15.01zM0-8.33v17m47.35-17v17M15.01 0h17.32m-8.66 32.8 8.66 15 15.02-8.66-8.67-15.01zM0 39.47v17m47.35-17v17M15.01 47.8h17.32m-56-32.8L-15 0 0 8.65l-8.66 15.01Zm47.35 0L15 0 0 8.65l8.67 15.01Zm0-30L15 0 0-8.66l8.67-15.01Zm47.33 30L62.35 0 47.33 8.65 56 23.67ZM23.67 62.8l8.66-15 15.02 8.66-8.67 15.01zm47.34-30-8.66 15-15.02-8.66L56 24.13Zm-47.33 30L15 47.8 0 56.45l8.67 15.01Zm-47.35-30 8.67 15 15-8.65-8.66-15.01zm47.35 0L15 47.8 0 39.15l8.67-15.01Z";
const TILE_W = 47.35;
const TILE_H = 47.8;
const TILE_SCALE = 2.2;

function DiamondTiles() {
  const tw = TILE_W * TILE_SCALE;
  const th = TILE_H * TILE_SCALE;
  const tiles = [];
  for (let y = -th; y < 540 + th; y += th) {
    for (let x = -tw; x < 960 + tw; x += tw) {
      tiles.push(<path key={`${x}-${y}`} transform={`translate(${x.toFixed(2)},${y.toFixed(2)}) scale(${TILE_SCALE})`} d={DIAMOND} />);
    }
  }
  return (
    <g fill="none" stroke="var(--deck-color-gold)" strokeWidth={0.5}>
      {tiles}
    </g>
  );
}

function PatternCover({ title, subtitle, eyebrow, date, version, stamp }) {
  const meta = [eyebrow, date].filter(Boolean).join(', ');
  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden', background: 'linear-gradient(100deg, #5c0925 0%, #830d35 55%, #9a1442 100%)' }}>
      <svg viewBox="0 0 960 540" width="960" height="540" style={{ position: 'absolute', inset: 0, display: 'block' }}>
        <defs>
          <linearGradient id="cover-fade" x1="280" y1="0" x2="960" y2="0" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#fff" stopOpacity="0" />
            <stop offset="0.35" stopColor="#fff" stopOpacity="0.5" />
            <stop offset="1" stopColor="#fff" stopOpacity="1" />
          </linearGradient>
          <linearGradient id="cover-sheen" x1="0" y1="0" x2="960" y2="540" gradientUnits="userSpaceOnUse">
            <stop offset="0.5" stopColor="#fff" stopOpacity="0" />
            <stop offset="0.7" stopColor="#fff" stopOpacity="0.1" />
            <stop offset="0.9" stopColor="#fff" stopOpacity="0" />
          </linearGradient>
          <mask id="cover-mask" maskUnits="userSpaceOnUse" x="0" y="0" width="960" height="540">
            <rect width="960" height="540" fill="url(#cover-fade)" />
            <polygon points="781.6,388.6 762.6,421.6 730.1,440.3 748.3,471.9 781.0,453.1 813.7,471.9 833.0,438.4 852.3,471.9 883.9,453.7 865.4,421.6 832.4,402.6 813.7,370.1" fill="#000" />
          </mask>
        </defs>
        <g mask="url(#cover-mask)">
          <DiamondTiles />
        </g>
        <rect width="960" height="540" fill="url(#cover-sheen)" />
      </svg>
      <div style={{ position: 'absolute', left: 56, bottom: 52, maxWidth: 470, color: 'var(--deck-color-light-bg)' }}>
        <div style={{ fontFamily: 'var(--deck-font-mono)', fontSize: 66, fontWeight: 700, lineHeight: 1, letterSpacing: '-0.03em', whiteSpace: 'pre-line' }}>{title}</div>
        {subtitle ? <div style={{ fontFamily: 'var(--deck-font-body)', fontSize: 14.5, lineHeight: 1.5, marginTop: 20, opacity: 0.92 }}>{subtitle}</div> : null}
        {meta ? <div style={{ fontFamily: 'var(--deck-font-body)', fontSize: 12, marginTop: 14, opacity: 0.7 }}>{meta}</div> : null}
      </div>
      <CoverStamp version={version} stamp={stamp} left={56} />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/favicon.svg" alt="Yali Capital" style={{ position: 'absolute', left: 785.5, top: 408.6, height: 42.9, width: 42.9, filter: 'brightness(0) invert(1)' }} />
    </div>
  );
}

export function Cover({ title, numeral, subtitle, eyebrow, tag, version, date, stamp, variant }) {
  if (variant === 'pattern') return <PatternCover title={title} subtitle={subtitle} eyebrow={eyebrow} date={date} version={version} stamp={stamp} />;
  if (variant === 'frame') return <FrameCover title={title} subtitle={subtitle} eyebrow={eyebrow} version={version} stamp={stamp || date} />;
  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', background: 'var(--deck-color-crimson)' }}>
      <div style={{ width: 110, flexShrink: 0, position: 'relative', overflow: 'hidden', background: 'var(--deck-color-crimson)' }}>
        <Honeycomb width={110} height={540} opacity={0.7} />
      </div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/favicon.svg" alt="Yali Capital" style={{ width: 72, height: 72, filter: 'brightness(0) invert(1)' }} />
        {eyebrow ? (
          <div style={{ fontFamily: 'var(--deck-font-mono)', fontSize: 11, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'rgba(235,222,132,0.65)' }}>
            {eyebrow}
          </div>
        ) : null}
        <div style={{ fontFamily: 'var(--deck-font-mono)', fontSize: 38, fontWeight: 400, color: '#fff', letterSpacing: '0.01em' }}>
          {title}
          {numeral ? <span style={{ fontSize: 28, opacity: 0.7 }}> {numeral}</span> : null}
        </div>
        <div style={{ fontFamily: 'var(--deck-font-body)', fontSize: 17, fontWeight: 400, color: 'rgba(255,255,255,0.75)' }}>{subtitle}</div>
        {tag ? (
          <div
            style={{
              marginTop: 16,
              fontFamily: 'var(--deck-font-mono)',
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
              color: 'var(--deck-color-gold)',
              border: '1px solid rgba(235,222,132,0.45)',
              padding: '5px 14px',
            }}
          >
            {tag}
          </div>
        ) : null}
      </div>
      <CoverStamp version={version} stamp={stamp || date} />
    </div>
  );
}
