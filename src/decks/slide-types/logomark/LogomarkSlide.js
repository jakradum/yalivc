// Legacy "END SLIDE — Logomark on crimson": the white logomark, centred.
export function LogomarkSlide() {
  return (
    <div style={{ width: '100%', height: '100%', background: 'var(--deck-color-crimson)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/favicon.svg" alt="Yali Capital" style={{ width: 88, height: 88, filter: 'brightness(0) invert(1)', opacity: 0.92 }} />
    </div>
  );
}
