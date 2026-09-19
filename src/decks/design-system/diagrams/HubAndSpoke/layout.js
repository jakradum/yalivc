// Exact literal coordinates copy-pasted from fund2-deck-v2.0.html's
// hub-and-spoke SVG — not recomputed trigonometry. The earlier
// geometry.js/diagram.config.js approach introduced small drift (viewBox
// clipping, spacing) across a few redesign rounds; this trades some of
// that "change one config number" flexibility for guaranteed pixel
// fidelity, per direct request after comparing renders side by side.
export const LAYOUT = {
  viewBox: { w: 880, h: 490 },
  hub: { cx: 440, cy: 245, r: 42 },
  outerRadius: 235,
  boundaryLines: [
    { x1: 488.3, y1: 257.9, x2: 654.4, y2: 302.5 },
    { x1: 391.7, y1: 257.9, x2: 225.6, y2: 302.5 },
  ],
  core: {
    'Life Sciences': { spoke: { x: 265.2, y: 237.4 }, icon: { x: 254.2, y: 220.4 }, labels: [{ x: 265.2, y: 264.4, text: 'Life Sciences' }] },
    'Smart Manufacturing': { spoke: { x: 301.2, y: 138.5 }, icon: { x: 290.2, y: 121.5 }, labels: [{ x: 301.2, y: 160.5, text: 'Smart' }, { x: 301.2, y: 173.5, text: 'Manufacturing' }] },
    'Fabless Semiconductor': { spoke: { x: 387.4, y: 78.1 }, icon: { x: 376.4, y: 61.1 }, labels: [{ x: 387.4, y: 100.1, text: 'Fabless' }, { x: 387.4, y: 113.1, text: 'Semiconductor' }] },
    'Artificial Intelligence': { spoke: { x: 492.6, y: 78.1 }, icon: { x: 481.6, y: 61.1 }, labels: [{ x: 492.6, y: 100.1, text: 'Artificial' }, { x: 492.6, y: 113.1, text: 'Intelligence' }] },
    Robotics: { spoke: { x: 578.8, y: 138.5 }, icon: { x: 567.8, y: 121.5 }, labels: [{ x: 578.8, y: 165.5, text: 'Robotics' }] },
    'Aerospace & Surveillance': { spoke: { x: 614.8, y: 237.4 }, icon: { x: 603.8, y: 220.4 }, labels: [{ x: 614.8, y: 259.4, text: 'Aerospace &' }, { x: 614.8, y: 272.4, text: 'Surveillance' }] },
  },
  adjacent: {
    'Space Tech': { spoke: { x: 585.5, y: 342.2 }, icon: { x: 574.5, y: 325.2 }, labels: [{ x: 585.5, y: 364.2, text: 'Space' }, { x: 585.5, y: 377.2, text: 'Tech' }] },
    Quantum: { spoke: { x: 496.3, y: 410.7 }, icon: { x: 485.3, y: 393.7 }, labels: [{ x: 496.3, y: 437.7, text: 'Quantum' }] },
    Energy: { spoke: { x: 383.7, y: 410.7 }, icon: { x: 372.7, y: 393.7 }, labels: [{ x: 383.7, y: 437.7, text: 'Energy' }] },
    'Advanced Materials': { spoke: { x: 294.5, y: 342.2 }, icon: { x: 283.5, y: 325.2 }, labels: [{ x: 294.5, y: 364.2, text: 'Advanced' }, { x: 294.5, y: 377.2, text: 'Materials' }] },
  },
};
