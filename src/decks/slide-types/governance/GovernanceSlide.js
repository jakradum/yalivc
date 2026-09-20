// Literal port of the legacy "Proposed structure for Fund II" flow diagram
// (fund2-deck-v2.0.html): same boxes, arrows, regulatory boundaries and
// legend, converted mechanically to JSX. The slide ground is painted by the
// canvas, so the legacy background <rect> is dropped. Only the title is a
// prop; the box copy is the fund's structure per the PPM, so changing it is
// a developer/legal change, not a content edit.
export function GovernanceSlide({ title = 'Proposed structure for Fund II' }) {
  return (
    <svg viewBox="0 0 960 540" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" style={{ display: 'block' }}>
      <text x="480" y="42" fontFamily="'JetBrains Mono',monospace" fontSize="22" fontWeight="700" fill="#830d35" textAnchor="middle">{title}</text>
      <line x1="36" y1="56" x2="924" y2="56" stroke="#363636" strokeWidth="1"/>
      <rect x="36" y="160" width="260" height="76" fill="none" stroke="#363636" strokeWidth="1" strokeDasharray="6 4"/>
      <text x="44" y="157" fontFamily="'JetBrains Mono',monospace" fontSize="7" letterSpacing="0.08em" fill="#888888">GIFT CITY · IFSC</text>
      <rect x="614" y="160" width="302" height="76" fill="none" stroke="#363636" strokeWidth="1" strokeDasharray="6 4"/>
      <text x="908" y="157" fontFamily="'JetBrains Mono',monospace" fontSize="7" letterSpacing="0.08em" fill="#888888" textAnchor="end">INDIA DOMESTIC</text>
      <rect x="52" y="72" width="228" height="48" fill="#ebde84" stroke="#363636" strokeWidth="1"/>
      <text x="166" y="91" fontFamily="'JetBrains Mono',monospace" fontSize="10.5" fontWeight="700" fill="#830d35" textAnchor="middle">OVERSEAS LPs</text>
      <text x="166" y="107" fontFamily="'Inter',sans-serif" fontSize="8.5" fill="#830d35" textAnchor="middle">NRIs · FPIs · foreign institutions</text>
      <rect x="630" y="72" width="266" height="48" fill="#d0d0d0" stroke="#363636" strokeWidth="1"/>
      <text x="763" y="91" fontFamily="'JetBrains Mono',monospace" fontSize="10.5" fontWeight="700" fill="#830d35" textAnchor="middle">DOMESTIC LPs</text>
      <text x="763" y="107" fontFamily="'Inter',sans-serif" fontSize="8.5" fill="#830d35" textAnchor="middle">HNIs · family offices · institutions</text>
      <rect x="52" y="176" width="228" height="48" fill="#ebde84" stroke="#363636" strokeWidth="1"/>
      <text x="166" y="195" fontFamily="'JetBrains Mono',monospace" fontSize="9.5" fontWeight="700" fill="#830d35" textAnchor="middle">GIFT CITY FEEDER FUND</text>
      <text x="166" y="210" fontFamily="'Inter',sans-serif" fontSize="8" fill="#830d35" textAnchor="middle">IFSCA registered · USD denominated</text>
      <rect x="630" y="176" width="266" height="48" fill="#d0d0d0" stroke="#363636" strokeWidth="1"/>
      <text x="763" y="195" fontFamily="'JetBrains Mono',monospace" fontSize="10.5" fontWeight="700" fill="#830d35" textAnchor="middle">AIF FUND 2</text>
      <text x="763" y="210" fontFamily="'Inter',sans-serif" fontSize="8.5" fill="#830d35" textAnchor="middle">Domestic LP + GIFT feeder as LP</text>
      <rect x="340" y="428" width="280" height="48" fill="#efefef" stroke="#363636" strokeWidth="1"/>
      <text x="480" y="447" fontFamily="'JetBrains Mono',monospace" fontSize="10.5" fontWeight="700" fill="#830d35" textAnchor="middle">PORTFOLIO</text>
      <text x="480" y="463" fontFamily="'Inter',sans-serif" fontSize="8.5" fill="#830d35" textAnchor="middle">As approved in the PPM</text>
      <line x1="166" y1="120" x2="166" y2="171" stroke="#363636" strokeWidth="1.2"/>
      <polygon points="166,176 162,164 170,164" fill="#830d35"/>
      <line x1="763" y1="120" x2="763" y2="171" stroke="#363636" strokeWidth="1.2"/>
      <polygon points="763,176 759,164 767,164" fill="#830d35"/>
      <line x1="280" y1="200" x2="625" y2="200" stroke="#363636" strokeWidth="1.2"/>
      <polygon points="630,200 618,196 618,204" fill="#830d35"/>
      <text x="452" y="191" fontFamily="'Inter',sans-serif" fontSize="8.5" fill="#888888" textAnchor="middle">LP in AIF</text>
      <line x1="763" y1="224" x2="763" y2="408" stroke="#363636" strokeWidth="1.2"/>
      <line x1="763" y1="408" x2="598" y2="408" stroke="#363636" strokeWidth="1.2"/>
      <line x1="598" y1="408" x2="598" y2="423" stroke="#363636" strokeWidth="1.2"/>
      <polygon points="598,428 594,416 602,416" fill="#830d35"/>
      <text x="776" y="313" fontFamily="'Inter',sans-serif" fontSize="8.5" fill="#888888">Deploys</text>
      <line x1="36" y1="508" x2="64" y2="508" stroke="#363636" strokeWidth="1.2"/>
      <polygon points="66,508 54,504 54,512" fill="#830d35"/>
      <text x="72" y="512" fontFamily="'Inter',sans-serif" fontSize="8" fill="#888888">Capital / management flow</text>
      <line x1="262" y1="508" x2="294" y2="508" stroke="#363636" strokeWidth="1" strokeDasharray="6 4"/>
      <text x="300" y="512" fontFamily="'Inter',sans-serif" fontSize="8" fill="#888888">Regulatory boundary</text>
      <rect x="468" y="501" width="12" height="12" fill="#ebde84" stroke="#363636" strokeWidth="1"/>
      <text x="484" y="512" fontFamily="'Inter',sans-serif" fontSize="8" fill="#888888">GIFT / overseas</text>
      <rect x="580" y="501" width="12" height="12" fill="#d0d0d0" stroke="#363636" strokeWidth="1"/>
      <text x="596" y="512" fontFamily="'Inter',sans-serif" fontSize="8" fill="#888888">Domestic</text>
    </svg>
  );
}
