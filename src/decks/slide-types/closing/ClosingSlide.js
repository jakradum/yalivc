// Ports the END SLIDE — crimson bg, logomark. Deliberately close to Cover
// (same visual family), kept as its own slide type since content differs.
export function ClosingSlide({ line }) {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        background: 'var(--deck-color-crimson)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/favicon.svg" alt="Yali Capital" style={{ width: 86, height: 86, filter: 'brightness(0) invert(1)' }} />
      {line ? (
        <div style={{ position: 'absolute', bottom: 30, color: 'rgba(255,255,255,0.6)', fontFamily: 'var(--deck-font-mono)', fontSize: 10 }}>
          {line}
        </div>
      ) : null}
    </div>
  );
}
