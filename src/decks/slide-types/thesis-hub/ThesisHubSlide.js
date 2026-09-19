import { HubAndSpoke } from '@/decks/design-system/diagrams/HubAndSpoke/HubAndSpoke';

// Wraps HubAndSpoke with the slide's heading. Real sector names come
// from fund2Settings.focusSectors/adjacentSectors via the mapper.
export function ThesisHubSlide({ heading, core = [], adjacent = [] }) {
  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', padding: '20px 30px' }}>
      <div style={{ fontFamily: 'var(--deck-font-mono)', fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
        {heading}
      </div>
      {/* Fixed px height, not flex:1/percentage — percentage-height SVG
          inside a flex container is a known-fragile pattern (see
          docs/CLAUDE.md's SVG-in-flex gotcha for the main site). */}
      <div style={{ height: 470 }}>
        <HubAndSpoke core={core} adjacent={adjacent} />
      </div>
    </div>
  );
}
