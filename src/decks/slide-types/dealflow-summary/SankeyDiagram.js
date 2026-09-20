// Literal port of the legacy Fund I dealflow Sankey (fund2-deck-v2.0.html,
// "SLIDE 8 — FUND I DEALFLOW SUMMARY"): same node/ribbon geometry and
// labels, converted mechanically to JSX. The flow counts (inbound → evaluated
// → watch / diligence / pass → portfolio) come from the CRM, not Sanity, so
// like the process copy they are code-owned; the ribbons are scaled to those
// numbers, so changing one means redrawing (a developer task), not an edit.
export function SankeyDiagram() {
  return (
    <svg viewBox="0 0 680 400" width="680" height="400" xmlns="http://www.w3.org/2000/svg" style={{ display: 'block', fontFamily: 'var(--deck-font-mono)', overflow: 'visible' }}>
      <text x="0"   y="16" fontSize="7" letterSpacing="1.2" fill="#830d35">INBOUND</text>
      <text x="200" y="16" fontSize="7" letterSpacing="1.2" fill="#830d35">EVALUATED</text>
      <text x="390" y="16" fontSize="7" letterSpacing="1.2" fill="#830d35">PIPELINE</text>
      <text x="568" y="16" fontSize="7" letterSpacing="1.2" fill="#830d35">PORTFOLIO</text>
      <path d="M12,30 C106,30 106,30 200,30 L200,141 C106,141 106,141 12,141 Z"
      fill="#f4c0d4" fillOpacity="0.55"/>
      <path d="M12,151 C106,151 106,151 200,151 L200,360 C106,360 106,360 12,360 Z"
      fill="#cccccc" fillOpacity="0.35"/>
      <path d="M212,30 C306,30 306,30 390,30 L390,93 C306,93 306,93 212,93 Z"
      fill="#db90a9" fillOpacity="0.55"/>
      <path d="M212,96 C306,96 306,101 390,101 L390,114 C306,114 306,109 212,109 Z"
      fill="#bb3e68" fillOpacity="0.55"/>
      <path d="M212,112 C306,112 306,122 390,122 L390,173 C306,173 306,141 212,141 Z"
      fill="#cccccc" fillOpacity="0.35"/>
      <path d="M402,101 C490,101 490,96 568,96 L568,114 C490,114 490,114 402,114 Z"
      fill="#830d35" fillOpacity="0.6"/>
      <rect x="0"   y="30"  width="12" height="330" fill="#fae3ec"/>
      <rect x="200" y="30"  width="12" height="111" fill="#f4c0d4"/>
      <rect x="200" y="151" width="12" height="209" fill="#cccccc"/>
      <rect x="390" y="30"  width="12" height="63"  fill="#db90a9"/>
      <rect x="390" y="101" width="12" height="13"  fill="#bb3e68"/>
      <rect x="390" y="122" width="12" height="51"  fill="#cccccc"/>
      <rect x="568" y="96"  width="12" height="18"  fill="#830d35"/>
      <text x="18" y="188" fontSize="8"  fill="#830d35" dominantBaseline="middle">Inbound</text>
      <text x="18" y="203" fontSize="11" fill="#830d35" fontWeight="700" dominantBaseline="middle">1,000+</text>
      <text x="218" y="63"  fontSize="8"  fill="#830d35" dominantBaseline="middle">Evaluated</text>
      <text x="218" y="78"  fontSize="11" fill="#830d35" fontWeight="700" dominantBaseline="middle">336</text>
      <text x="218" y="240" fontSize="8"  fill="#830d35" dominantBaseline="middle">Not pursued</text>
      <text x="218" y="255" fontSize="10" fill="#830d35" fontWeight="700" dominantBaseline="middle">664</text>
      <text x="408" y="48"  fontSize="8"   fill="#830d35" dominantBaseline="middle">Watch / Park</text>
      <text x="408" y="63"  fontSize="10"  fill="#830d35" fontWeight="700" dominantBaseline="middle">190</text>
      <text x="408" y="104" fontSize="8"   fill="#830d35" dominantBaseline="middle">Diligence</text>
      <text x="408" y="118" fontSize="10"  fill="#830d35" fontWeight="700" dominantBaseline="middle">18</text>
      <text x="408" y="138" fontSize="8"   fill="#830d35" dominantBaseline="middle">Pass</text>
      <text x="408" y="152" fontSize="10"  fill="#830d35" fontWeight="700" dominantBaseline="middle">155</text>
      <rect x="584" y="89"  width="82" height="32" fill="rgba(131,13,53,0.07)"/>
      <line x1="584" y1="89" x2="584" y2="121" stroke="#830d35" strokeWidth="1.5" strokeOpacity="0.45"/>
      <text x="592" y="101" fontSize="8"  fill="#830d35" dominantBaseline="middle">Portfolio</text>
      <text x="592" y="115" fontSize="11" fill="#830d35" fontWeight="700" dominantBaseline="middle">7</text>
    </svg>
  );
}
