// Breadcrumb trail for the team site's inner pages, shown under the top bar and
// again at the foot of the page. `trail` is [[label, href], ..., [label]]: every
// item but the last links back up; the last is the page itself. Links use /team/...
// like the home page (the proxy serves them at clean paths on team.yali.vc).
// The leave and admin pages are plain HTML and get the same markup from
// crumbsHtml() in yali-override.js. Hidden in print.
const mono = 'var(--font-jetbrains-mono, "JetBrains Mono", monospace)';

export const CRUMBS_CSS = `
.yali-crumbs { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; padding: 11px 28px; box-sizing: border-box; width: 100%;
  font-family: ${mono}; font-size: 12px; line-height: 1.4; color: #595959; background: #efefef; }
.yali-crumbs.top { border-bottom: 1px solid #363636; }
.yali-crumbs.bottom { border-top: 1px solid #363636; margin-top: 48px; }
.yali-crumbs a { color: #363636; text-decoration: none; }
.yali-crumbs a:hover { color: #830d35; text-decoration: underline; }
.yali-crumbs .sep { color: #9a9590; }
.yali-crumbs .here { color: #830d35; font-weight: 700; }
@media print { .yali-crumbs { display: none !important; } }
`;

export function Breadcrumbs({ trail, position = 'top' }) {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CRUMBS_CSS }} />
      <nav className={`yali-crumbs ${position}`} aria-label="Breadcrumb">
        {trail.map(([label, href], i) => (
          <span key={i} style={{ display: 'contents' }}>
            {i > 0 && <span className="sep" aria-hidden="true">/</span>}
            {href && i < trail.length - 1 ? <a href={href}>{label}</a> : <span className="here" aria-current="page">{label}</span>}
          </span>
        ))}
      </nav>
    </>
  );
}

// Top and bottom together, for pages that just wrap their content.
export const TEAM = ['Team', '/team/'];
