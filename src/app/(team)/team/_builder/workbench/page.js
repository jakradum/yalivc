import { requireDeckUser } from '@/decks/auth';
import { workbenchEntries } from '@/decks/workbench/registry';
import '@/decks/design-system/fonts.css';
import '@/decks/design-system/tokens.css';

export const metadata = { robots: 'noindex, nofollow' };

// Isolated component preview — every block, every fixture (including
// stress cases), side by side. Fast loop for tweaking a shared component
// without loading the whole deck. Same internal-only guard as the deck.
export default async function DeckWorkbenchPage() {
  await requireDeckUser();
  return (
    <div className="deck-root" style={{ padding: 24, fontFamily: 'var(--deck-font-body)' }}>
      <h1 style={{ fontFamily: 'var(--deck-font-mono)', fontSize: 16 }}>Deck Workbench</h1>
      {workbenchEntries.map(({ name, Component, fixtures, dark, box }) => (
        <section key={name} style={{ marginBottom: 40 }}>
          <h2 style={{ fontFamily: 'var(--deck-font-mono)', fontSize: 12, textTransform: 'uppercase' }}>
            {name}
          </h2>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            {Object.entries(fixtures).map(([fixtureName, props]) => (
              <div key={fixtureName} style={{ border: '1px solid #ccc' }}>
                <div
                  style={{
                    fontFamily: 'var(--deck-font-mono)',
                    fontSize: 10,
                    padding: '4px 8px',
                    background: '#eee',
                  }}
                >
                  {fixtureName}
                </div>
                <div
                  style={{
                    padding: 16,
                    background: dark ? '#830d35' : '#fff',
                    minWidth: box?.width || 220,
                    width: box?.width,
                    height: box?.height,
                    position: box?.relative ? 'relative' : undefined,
                  }}
                >
                  <Component {...props} />
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
