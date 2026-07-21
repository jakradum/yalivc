// Shared CSS override injected into both team HTML apps.
// Applied after the original <style> block so cascade wins without !important on most rules.
// Where the original uses a * selector we need !important or higher specificity.

export const YALI_HEAD_INJECT = `
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700&family=JetBrains+Mono:wght@400;600;700&display=swap" rel="stylesheet">
<style>
  /* ── Yali nav bar ────────────────────────────────────────────────────── */
  .yali-nav {
    position: fixed; top: 0; left: 0; right: 0; z-index: 99999;
    background: #830d35; height: 52px;
    display: flex; align-items: center; padding: 0 28px; gap: 14px;
    border-bottom: 1px solid #363636; box-sizing: border-box;
  }
  .yali-nav .yn-label {
    font-family: 'JetBrains Mono', monospace; font-size: 9px; font-weight: 700;
    letter-spacing: 0.18em; text-transform: uppercase;
    color: rgba(235,222,132,0.85); flex-shrink: 0;
  }
  .yali-nav .yn-sep { width: 1px; height: 16px; background: rgba(239,239,239,0.25); flex-shrink: 0; }
  .yali-nav .yn-title {
    font-family: 'JetBrains Mono', monospace; font-size: 13px; font-weight: 400;
    color: #efefef; text-decoration: none;
  }
  .yali-nav .yn-title:hover { color: #ebde84; }
  body { padding-top: 52px !important; margin-top: 0 !important; }

  /* ── Remap brand tokens ──────────────────────────────────────────────── */
  :root {
    --maroon: #830d35 !important;
    --maroon-brand: #830d35 !important;
    --maroon-deep: #5a0925 !important;
    --grey: #595959 !important;
    --border: #363636 !important;
    --surface-1: #efefef !important;
  }

  /* ── Base ────────────────────────────────────────────────────────────── */
  /* Override the *{font-family:Overpass} with higher-specificity selector */
  body, body * { font-family: 'Inter', Arial, sans-serif; }
  body { background: #efefef !important; color: #363636 !important; }

  /* Remove all border-radius everywhere except pills (handled below) */
  body *, body *::before, body *::after { border-radius: 0 !important; }

  /* ── Hide original header (yali-nav replaces it) ─────────────────────── */
  .head { display: none !important; }

  /* ── Wrap ────────────────────────────────────────────────────────────── */
  .wrap { background: #efefef; padding: 1.5rem; }

  /* ── Section title ───────────────────────────────────────────────────── */
  .title {
    font-family: 'JetBrains Mono', monospace !important;
    font-size: 15px !important; font-weight: 400 !important;
    color: #363636 !important; letter-spacing: 0 !important;
  }
  .sub { font-family: 'Inter', Arial, sans-serif !important; color: #595959 !important; font-size: 12px !important; }

  /* ── Card ────────────────────────────────────────────────────────────── */
  .card {
    background: #fff !important;
    border: 1px solid #363636 !important;
    border-top: 3px solid #830d35 !important;
    padding: 1.5rem !important;
  }

  /* ── Labels ──────────────────────────────────────────────────────────── */
  label {
    font-family: 'JetBrains Mono', monospace !important;
    font-size: 10px !important; font-weight: 700 !important;
    letter-spacing: 0.18em !important; text-transform: uppercase !important;
    color: #830d35 !important; margin-bottom: 8px !important;
    display: block;
  }

  /* ── Inputs / selects ────────────────────────────────────────────────── */
  input, select {
    border: 1px solid #363636 !important;
    background: #fff !important; color: #363636 !important;
    font-family: 'Inter', Arial, sans-serif !important;
    font-size: 13px !important; padding: 9px 10px !important;
  }
  input:focus, select:focus { outline: 2px solid #830d35 !important; outline-offset: 0; }

  /* ── Stat / KPI cards ────────────────────────────────────────────────── */
  .stat {
    background: #fff !important;
    border: 1px solid #363636 !important;
    border-left: 3px solid #830d35 !important;
    padding: 0.75rem 1rem !important;
  }
  .stat .l {
    font-family: 'JetBrains Mono', monospace !important;
    font-size: 9px !important; font-weight: 700 !important;
    letter-spacing: 0.18em !important; text-transform: uppercase !important;
    color: #830d35 !important;
  }
  .stat .v {
    font-family: 'JetBrains Mono', monospace !important;
    font-size: 1.375rem !important; font-weight: 700 !important;
    color: #363636 !important;
  }

  /* ── Segment tabs (request-form) ─────────────────────────────────────── */
  .seg { border: 1px solid #363636 !important; overflow: hidden; }
  .seg button {
    font-family: 'JetBrains Mono', monospace !important;
    font-size: 11px !important; font-weight: 700 !important;
    letter-spacing: 0.08em !important; text-transform: uppercase !important;
    color: #595959 !important; background: #fff !important;
    border-right: 1px solid #363636 !important;
    padding: 10px 14px !important;
  }
  .seg button:last-child { border-right: none !important; }
  .seg button.on { background: #830d35 !important; color: #fff !important; }

  /* ── Primary button ──────────────────────────────────────────────────── */
  .btn {
    background: #830d35 !important; color: #fff !important;
    font-family: 'JetBrains Mono', monospace !important;
    font-size: 11px !important; font-weight: 700 !important;
    letter-spacing: 0.12em !important; text-transform: uppercase !important;
    padding: 12px 16px !important; cursor: pointer;
  }
  .btn:hover:not(:disabled) { background: #5a0925 !important; }
  .btn.ghost { background: #363636 !important; }
  .btn.ghost:hover { background: #1a1a1a !important; }

  /* ── Status feedback ─────────────────────────────────────────────────── */
  .ok, .succ { color: #3B6D11 !important; }
  .err { background: #FCEBEB !important; color: #A32D2D !important; border: 1px solid #e0a0a0 !important; }
  .warn { background: #FAEEDA !important; color: #854F0B !important; border: 1px solid #e0c890 !important; }

  /* ── Dashboard-specific ──────────────────────────────────────────────── */

  /* Tabs */
  .tabs { border-bottom: 1px solid #363636 !important; gap: 0 !important; margin-bottom: 1rem; }
  .tab {
    font-family: 'JetBrains Mono', monospace !important;
    font-size: 11px !important; font-weight: 700 !important;
    letter-spacing: 0.08em !important; text-transform: uppercase !important;
    color: #595959 !important; padding: 8px 16px !important;
    border-bottom: 2px solid transparent !important;
    background: transparent !important;
  }
  .tab.on { color: #830d35 !important; border-bottom-color: #830d35 !important; }
  .tab:hover:not(.on) { color: #363636 !important; }

  /* Table */
  table { border-collapse: collapse !important; }
  th {
    background: #830d35 !important; color: #fff !important;
    font-family: 'JetBrains Mono', monospace !important;
    font-size: 10px !important; font-weight: 700 !important;
    letter-spacing: 0.12em !important; text-transform: uppercase !important;
    padding: 10px 12px !important; text-align: left;
  }
  td {
    border-bottom: 1px solid #363636 !important;
    font-family: 'Inter', Arial, sans-serif !important;
    font-size: 13px !important; padding: 10px 12px !important; color: #363636 !important;
  }
  tr:last-child td { border-bottom: none !important; }
  tr:hover td { background: #efefef !important; }

  /* Frame */
  .frame { border: 1px solid #363636 !important; overflow: hidden; }

  /* Pills */
  .pill {
    font-family: 'JetBrains Mono', monospace !important;
    font-size: 10px !important; font-weight: 700 !important;
    letter-spacing: 0.06em !important; padding: 3px 8px !important;
  }

  /* Progress bar */
  .bar { background: #d0d0d0 !important; height: 5px !important; overflow: hidden; }
  .bar span { display: block; height: 100%; }

  /* Mini approve/reject buttons */
  .mini {
    font-family: 'JetBrains Mono', monospace !important;
    font-size: 10px !important; font-weight: 700 !important;
    letter-spacing: 0.06em !important; text-transform: uppercase !important;
    padding: 5px 10px !important; cursor: pointer;
  }
  .mini.approve { background: #2e7d32 !important; }
  .mini.approve:hover { background: #1b5e20 !important; }
  .mini.reject { background: #A32D2D !important; }
  .mini.reject:hover { background: #7f2222 !important; }

  /* Controls row */
  .controls { display: flex; gap: 8px; margin-bottom: 0.85rem; align-items: center; }

  /* Sign-in screen */
  .center {
    min-height: calc(70vh - 52px) !important;
    display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    gap: 16px; text-align: center;
  }

  /* Auth error */
  .err { border: 1px solid #e0a0a0 !important; font-size: 13px !important; }
</style>`;

export const YALI_NAV_HTML = `<nav class="yali-nav">
  <span class="yn-label">Yali Capital</span>
  <span class="yn-sep"></span>
  <a href="/team/" class="yn-title">Team Portal</a>
</nav>`;
