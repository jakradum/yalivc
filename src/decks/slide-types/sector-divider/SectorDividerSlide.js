// One divider slide per sector, ahead of that sector's map+tests pair —
// matches the map/tests slides' visual language (crimson duotone photo,
// giant hollow-outline figure etched on it) rather than the flat-crimson
// SectionDividerSlide the fund-ii deck uses, since this deck's whole
// identity is built around photo+outline, not a flat colour block.
function Outline({ children, size }) {
  return (
    <div
      className="mono"
      style={{
        fontFamily: 'var(--deck-font-mono)',
        fontSize: size,
        fontWeight: 700,
        lineHeight: 1.35,
        letterSpacing: '-0.03em',
        color: 'transparent',
        WebkitTextStroke: '1px rgba(255,255,255,0.95)',
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </div>
  );
}

// Sector names range from "Robotics" (8 chars) to "Fabless Semiconductor"
// (21 chars, longest single word "Semiconductor" at 13). A fixed font-size
// clips the longer names against the 368px text column (960 - 520 photo
// rail - 72 padding), since JetBrains Mono can't break mid-word. Size off
// the longest word, not the full string, and clamp to keep short names from
// going oversized.
const TEXT_COL_WIDTH = 368;
function titleFontSize(name) {
  const longestWord = name.split(/\s+/).reduce((a, b) => (b.length > a.length ? b : a), '');
  const fit = TEXT_COL_WIDTH / (longestWord.length * 0.62);
  return Math.max(34, Math.min(58, fit));
}

// `eyebrowLabel`/`outlineLabel` default to the "SECTOR N OF 06" pattern
// the six core sectors use, but the Other Deep Tech group divider isn't
// a 7th core sector — it overrides both so it reads as its own thing
// ("OTHER DEEP TECH" / "+4") rather than a broken "SECTOR 07 OF 06".
export function SectorDividerSlide({ index, name, subtitle, imageUrl, eyebrowLabel, outlineLabel }) {
  const titleSize = titleFontSize(name);
  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', boxSizing: 'border-box' }}>
      <div style={{ width: 520, flexShrink: 0, position: 'relative', overflow: 'hidden' }}>
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imageUrl} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', filter: 'grayscale(1) contrast(1.08) brightness(1.0)' }} />
        ) : null}
        <div style={{ position: 'absolute', inset: 0, background: 'var(--deck-color-crimson)', mixBlendMode: 'multiply', opacity: 0.72 }} />
        <div style={{ position: 'absolute', inset: 0, background: '#fff', mixBlendMode: 'screen', opacity: 0.1 }} />
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', paddingLeft: 36 }}>
          <Outline size={220}>{outlineLabel || index}</Outline>
        </div>
      </div>

      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', paddingLeft: 36, paddingRight: 36, boxSizing: 'border-box' }}>
        <div style={{ fontFamily: 'var(--deck-font-mono)', fontSize: 11, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--deck-color-crimson)', marginBottom: 8 }}>
          {eyebrowLabel || `SECTOR ${index} OF 06`}
        </div>
        <div style={{ fontFamily: 'var(--deck-font-mono)', fontSize: titleSize, fontWeight: 700, color: 'var(--deck-color-ink)', lineHeight: 1.1, letterSpacing: '-0.02em' }}>{name}</div>
        <div style={{ fontFamily: 'var(--deck-font-body)', fontSize: 13, color: '#555', marginTop: 4, maxWidth: 340, lineHeight: 1.5 }}>{subtitle}</div>
      </div>
    </div>
  );
}
