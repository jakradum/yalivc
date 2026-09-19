// Canvas size confirmed in docs/CLAUDE.md: fund2-deck-v2.0.html uses
// @page { size: 960px 540px; margin: 0; } — NOT A4. Keep this the single
// source of truth; PrintShell injects @page from these values (can't use
// CSS var() inside @page).
export const SLIDE_W = 960;
export const SLIDE_H = 540;

export const DECK_IDS = ['fund-ii'];
