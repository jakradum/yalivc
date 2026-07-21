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
  body { background: linear-gradient(135deg, #f8f7f5 0%, #e4dfd8 50%, #d8d2cb 100%) fixed !important; color: #363636 !important; }

  /* Remove all border-radius everywhere except pills (handled below) */
  body *, body *::before, body *::after { border-radius: 0 !important; }

  /* ── Hide original header branding; keep action buttons ─────────────── */
  /* .head contains logo + title div + Download PDF btn + Sign out btn.
     Hide only the branding elements; surface the buttons in a toolbar row. */
  .head {
    display: flex !important;
    align-items: center !important;
    justify-content: flex-end !important;
    gap: 8px !important;
    padding: 12px 0 8px !important;
    background: transparent !important;
    border: none !important;
  }
  .head img.logo { display: none !important; }
  .head > div   { display: none !important; }

  /* ── Wrap ────────────────────────────────────────────────────────────── */
  .wrap {
    background: transparent;
    padding: 1.5rem;
    min-height: calc(100vh - 52px);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    box-sizing: border-box;
  }
  /* Leave form card — constrain width so it doesn't stretch full-page */
  .card { width: 100%; max-width: 560px; }
  /* Dashboard main wrap — full-width, top-aligned content */
  #app.wrap { align-items: stretch !important; justify-content: flex-start !important; }

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

  /* ── Skeleton shimmer ────────────────────────────────────────────────── */
  @keyframes yali-shimmer {
    0%   { background-position: -600px 0; }
    100% { background-position:  600px 0; }
  }
  .sk-shine {
    background: linear-gradient(90deg, #e2e2e2 25%, #ececec 50%, #e2e2e2 75%);
    background-size: 1200px 100%;
    animation: yali-shimmer 1.4s infinite linear;
  }
  .sk-stats { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 12px; }
  .sk-stat  { background: #fff; border: 1px solid #363636; border-left: 3px solid #d4bec6; padding: 12px; }
  .sk-lbl   { height: 9px; width: 55%; margin-bottom: 8px; }
  .sk-val   { height: 22px; width: 38%; }
  .sk-seg   { display: flex; border: 1px solid #363636; margin-bottom: 12px; overflow: hidden; }
  .sk-tab   { height: 38px; flex: 1; border-right: 1px solid #363636; }
  .sk-tab:last-child { border-right: none; }
  .sk-form  { border: 1px solid #363636; border-top: 3px solid #d4bec6; padding: 20px; }
  .sk-field-lbl { height: 9px; width: 42%; margin-bottom: 8px; }
  .sk-field-inp { height: 36px; width: 100%; margin-bottom: 16px; border: 1px solid #d8d8d8; }
  .sk-row   { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
  .sk-hint  { height: 9px; width: 80%; margin: 12px 0 16px; }
  .sk-btn   { height: 40px; width: 100%; background: linear-gradient(90deg, #ccc0c4 25%, #d8d0d4 50%, #ccc0c4 75%) !important;
              background-size: 1200px 100% !important; animation: yali-shimmer 1.4s infinite linear !important; }
  /* apply shine class to all sk- elements except sk-btn (handled above) and containers */
  .sk-lbl, .sk-val, .sk-tab, .sk-field-lbl, .sk-field-inp, .sk-hint {
    background: linear-gradient(90deg, #e2e2e2 25%, #ececec 50%, #e2e2e2 75%);
    background-size: 1200px 100%;
    animation: yali-shimmer 1.4s infinite linear;
  }
</style>`;

export const YALI_NAV_HTML = `<nav class="yali-nav">
  <a href="/team/" style="display:flex;align-items:center;height:100%;text-decoration:none;flex-shrink:0;">
    <img src="/favicon.svg" style="height:22px;width:auto;filter:brightness(0) invert(1);display:block;" alt="Yali">
  </a>
  <span class="yn-sep"></span>
  <span class="yn-title">Team</span>
</nav>`;

// Skeleton injected into the leave form — previews stats, tabs, and form fields.
// Inserted after #emp select via JS; hidden by MutationObserver when #panel shows.
export const LEAVE_SKELETON_SCRIPT = `<script>
(function() {
  var skel = document.createElement('div');
  skel.id = 'yali-skel';
  skel.style.marginTop = '16px';
  skel.innerHTML = [
    '<div class="sk-stats">',
      '<div class="sk-stat"><div class="sk-lbl"></div><div class="sk-val"></div></div>',
      '<div class="sk-stat"><div class="sk-lbl"></div><div class="sk-val"></div></div>',
    '</div>',
    '<div class="sk-seg">',
      '<div class="sk-tab"></div><div class="sk-tab"></div><div class="sk-tab"></div>',
    '</div>',
    '<div class="sk-form">',
      '<div class="sk-field-lbl"></div>',
      '<div class="sk-field-inp"></div>',
      '<div class="sk-row">',
        '<div><div class="sk-field-lbl"></div><div class="sk-field-inp"></div></div>',
        '<div><div class="sk-field-lbl"></div><div class="sk-field-inp"></div></div>',
      '</div>',
      '<div class="sk-hint"></div>',
      '<div class="sk-btn"></div>',
    '</div>'
  ].join('');

  var emp = document.getElementById('emp');
  if (emp) emp.parentNode.insertBefore(skel, emp.nextSibling);

  var panel = document.getElementById('panel');
  if (panel) {
    new MutationObserver(function() {
      skel.style.display = panel.style.display === 'none' ? 'block' : 'none';
    }).observe(panel, { attributes: true, attributeFilter: ['style'] });
  }
})();
<\/script>`;

// Redesigned PDF export — injected into admin dashboard, overrides the original generatePDF.
// Matches Yali quarterly report style: warm #eeeceb background, JetBrains Mono headers,
// crimson section labels with rule, white-card KPI strip, minimal table headers.
export const YALI_ADMIN_PDF_SCRIPT = `<script>
(function() {
  var CRIMSON = [131, 13, 53];
  var TEXT    = [54, 54, 54];
  var GRAY    = [136, 136, 136];
  var BG      = [238, 236, 235];
  var BG2     = [229, 226, 223];
  var ML = 36, MR = 36;

  // Reuse fmtDate from dashboard scope if available, else define locally
  var _fmt = typeof fmtDate !== 'undefined' ? fmtDate : function(s) {
    if (!s) return '-';
    var d = new Date(s);
    var m = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return d.getDate() + ' ' + m[d.getMonth()] + " '" + String(d.getFullYear()).slice(2);
  };

  function newGeneratePDF() {
    var jsPDF = (window.jspdf || {}).jsPDF;
    if (!jsPDF) { alert('PDF library still loading, please try again.'); return; }

    var d  = new jsPDF({ unit: 'pt', format: 'a4' });
    var PW = d.internal.pageSize.getWidth();
    var PH = d.internal.pageSize.getHeight();

    var now = new Date();
    var mo  = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    var stamp = now.getDate() + ' ' + mo[now.getMonth()] + ' ' + now.getFullYear()
              + '  ' + String(now.getHours()).padStart(2,'0') + ':' + String(now.getMinutes()).padStart(2,'0');

    function drawBg() {
      d.setFillColor.apply(d, BG); d.rect(0, 0, PW, PH, 'F');
    }

    function drawPageHeader() {
      d.setFont('helvetica','bold'); d.setFontSize(8);
      d.setTextColor.apply(d, CRIMSON);
      d.text('YALI CAPITAL', ML, 26);

      var bw = d.getStringUnitWidth('YALI CAPITAL') * 8 / d.internal.scaleFactor + 10;
      d.setDrawColor.apply(d, CRIMSON); d.setLineWidth(0.75);
      d.line(ML + bw, 21, PW - ML - 96, 21);

      d.setFont('helvetica','normal'); d.setFontSize(7);
      d.setTextColor.apply(d, GRAY);
      d.text('LEAVE & WFH REPORT', PW - ML, 18, { align:'right' });
      d.text(stamp, PW - ML, 28, { align:'right' });

      d.setDrawColor(210,207,205); d.setLineWidth(0.4);
      d.line(ML, 36, PW - MR, 36);
    }

    function sectionHeader(label, y) {
      d.setFont('helvetica','bold'); d.setFontSize(7.5);
      d.setTextColor.apply(d, CRIMSON);
      d.text(label.toUpperCase(), ML, y);
      d.setDrawColor.apply(d, CRIMSON); d.setLineWidth(0.5);
      d.line(ML, y + 3, PW - MR, y + 3);
      return y + 14;
    }

    function tableOpts(head, body, startY) {
      return {
        head:[head], body:body, startY:startY,
        theme:'plain',
        styles:{ font:'helvetica', fontSize:8.5,
          cellPadding:{ top:5, right:8, bottom:5, left:8 },
          textColor:TEXT, fillColor:false, lineWidth:0 },
        headStyles:{ fontStyle:'bold', fontSize:7.5,
          textColor:CRIMSON, fillColor:BG, lineWidth:0 },
        alternateRowStyles:{ fillColor:BG2 },
        margin:{ left:ML, right:MR, top:48 },
        didDrawCell: function(data) {
          if (data.section === 'head' && data.column.index === 0) {
            d.setDrawColor.apply(d, CRIMSON); d.setLineWidth(0.75);
            d.line(ML, data.cell.y, PW - MR, data.cell.y);
            d.line(ML, data.cell.y + data.cell.height, PW - MR, data.cell.y + data.cell.height);
          } else if (data.section === 'body' && data.column.index === 0) {
            d.setDrawColor(210,207,205); d.setLineWidth(0.25);
            d.line(ML, data.cell.y + data.cell.height, PW - MR, data.cell.y + data.cell.height);
          }
        },
        didDrawPage: function(data) {
          if (data.pageNumber > 1) { drawBg(); drawPageHeader(); }
        },
      };
    }

    // Page 1
    drawBg(); drawPageHeader();

    // KPI strip
    var totPaid = employees.reduce(function(s,e){ return s+(+e.paidTaken||0); }, 0);
    var totSick = employees.reduce(function(s,e){ return s+(+e.medicalTaken||0); }, 0);
    var pending = requests.filter(function(r){ return r.status==='pending'; }).length;
    var offWfh  = wfh.filter(function(w){ return w.offPattern; }).length;
    var kpis = [
      { l:'TEAM MEMBERS',        v:String(employees.length) },
      { l:'PAID LEAVE TAKEN',    v:String(totPaid)          },
      { l:'SICK / CASUAL TAKEN', v:String(totSick)          },
      { l:'PENDING APPROVALS',   v:String(pending)          },
    ];
    var y = 48;
    var kW = (PW - ML - MR - 12) / 4;
    kpis.forEach(function(k, i) {
      var x = ML + i * (kW + 4);
      d.setFillColor(255,255,255); d.rect(x, y, kW, 42, 'F');
      d.setFillColor.apply(d, CRIMSON); d.rect(x, y, 2.5, 42, 'F');
      d.setFont('helvetica','bold'); d.setFontSize(6.5);
      d.setTextColor.apply(d, CRIMSON); d.text(k.l, x+8, y+12);
      d.setFont('helvetica','bold'); d.setFontSize(18);
      d.setTextColor.apply(d, TEXT); d.text(k.v, x+8, y+32);
    });
    y += 56;

    // Leave balances
    y = sectionHeader('Leave balances', y);
    var balBody = employees.slice().sort(function(a,b){ return String(a.name).localeCompare(String(b.name)); }).map(function(e) {
      var pe=+e.paidEntitlement||0, pt=+e.paidTaken||0, me=+e.medicalEntitlement||0, mt=+e.medicalTaken||0;
      return [e.name, e.department||'', String(pt), String(pe-pt), String(mt), String(me-mt)];
    });
    d.autoTable(tableOpts(['Employee','Department','Paid taken','Paid remaining','Sick taken','Sick remaining'],
      balBody.length ? balBody : [['-','-','-','-','-','-']], y));

    // Leave requests
    y = d.lastAutoTable.finalY + 16;
    y = sectionHeader('Leave requests', y);
    var ord = { 'pending':0, 'auto-approved':1, 'approved':1, 'rejected':2 };
    var reqBody = requests.slice().sort(function(a,b){ return ((ord[a.status]||9)-(ord[b.status]||9)); }).map(function(r) {
      return [r.name, r.type==='medical'?'Sick / Casual':'Paid',
              _fmt(r.from)+' to '+_fmt(r.to), String(r.days), r.reason||'', r.status||''];
    });
    d.autoTable(tableOpts(['Employee','Type','Dates','Days','Reason','Status'],
      reqBody.length ? reqBody : [['-','-','-','-','-','-']], y));

    // WFH log
    y = d.lastAutoTable.finalY + 16;
    y = sectionHeader('WFH log', y);
    var wfhBody = wfh.slice().sort(function(a,b){ return String(b.date).localeCompare(String(a.date)); }).map(function(w) {
      return [w.name, w.department||'', _fmt(w.date), w.weekday||'', w.offPattern?'Off-pattern':'Normal'];
    });
    d.autoTable(tableOpts(['Employee','Department','Date','Day','Pattern'],
      wfhBody.length ? wfhBody : [['-','-','-','-','-']], y));

    // Weekend log
    y = d.lastAutoTable.finalY + 16;
    y = sectionHeader('Weekend days off', y);
    var wkBody = weekend.slice().sort(function(a,b){ return String(b.date).localeCompare(String(a.date)); }).map(function(w) {
      return [w.name, w.department||'', _fmt(w.date), w.weekday||'', w.weekKey||''];
    });
    d.autoTable(tableOpts(['Employee','Department','Date','Day','Week'],
      wkBody.length ? wkBody : [['-','-','-','-','-']], y));

    // Footers on all pages
    var np = d.internal.getNumberOfPages();
    for (var i = 1; i <= np; i++) {
      d.setPage(i);
      d.setFont('helvetica','normal'); d.setFontSize(7);
      d.setTextColor.apply(d, GRAY);
      d.text('YALI CAPITAL — CONFIDENTIAL   |   Page ' + i + ' of ' + np,
             PW / 2, PH - 16, { align:'center' });
    }

    var fn = 'yali-leave-report-' + now.getFullYear()
           + String(now.getMonth()+1).padStart(2,'0')
           + String(now.getDate()).padStart(2,'0') + '.pdf';
    d.save(fn);
  }

  // Swap out the button's event listener
  var btn = document.getElementById('download-pdf');
  if (btn) {
    var nb = btn.cloneNode(true);
    btn.parentNode.replaceChild(nb, btn);
    nb.addEventListener('click', newGeneratePDF);
  }
})();
<\/script>`;
