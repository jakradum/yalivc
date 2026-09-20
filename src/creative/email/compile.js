import { FORMATS } from '../formats.js';
import { getBrand } from '../brands/index.js';
import { readableOn } from '../contrast.js';
import { renditionUrl } from '../library.js';

// Compiles an `email` asset to table-based, inline-styled HTML — the only
// markup that renders consistently across Gmail/Outlook/Apple Mail. Same
// document, same validated blocks; a different (older) output target.
// `baseUrl` prefixes image paths so they resolve outside the app.
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const RATIO = { '1:1': 1, '4:5': 0.8, '16:9': 9 / 16, '3:2': 2 / 3, '3:4': 4 / 3 };
const ALIGN = { start: 'left', center: 'center', end: 'right' };
const VALIGN = { start: 'top', center: 'middle', end: 'bottom', stretch: 'top' };

export function compileEmail(doc, { baseUrl = '' } = {}) {
  const brand = getBrand(doc.brand);
  const format = FORMATS[doc.format];
  const space = (k) => brand.space[k || 'none'].email;
  const col = (k) => brand.colors[k];
  const font = (r) => brand.fonts[brand.type[r].font].email;

  const roleCss = (r) => {
    const t = brand.type[r];
    const size = t.email;
    return [
      `font-family:${font(r)}`,
      `font-size:${size}px`,
      `font-weight:${t.weight}`,
      `line-height:${Math.round(size * t.lh)}px`,
      t.ls ? `letter-spacing:${(t.ls * size).toFixed(1)}px` : '',
      t.upper ? 'text-transform:uppercase' : '',
    ].filter(Boolean).join(';');
  };
  const rich = (text) =>
    esc(text)
      .split('==')
      .map((seg, i, all) => (i % 2 && all.length % 2 === 1 ? `<span style="background-color:${col('gold')};color:${col('ink')};padding:0 3px;">${seg}</span>` : seg))
      .join('')
      .replace(/\n/g, '<br>');
  const table = (inner, extra = '') => `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"${extra}>${inner}</table>`;
  const row = (inner, attrs = '') => `<tr><td${attrs}>${inner}</td></tr>`;
  const gapRow = (h) => (h ? `<tr><td height="${h}" style="height:${h}px;font-size:0;line-height:0;">&nbsp;</td></tr>` : '');

  const wrapBox = (b, inner, width) => {
    const pad = space(b.padding);
    const styles = [
      b.fill ? `background-color:${col(b.fill)}` : '',
      b.border ? `border:2px solid ${col(b.border)}` : '',
      b.radius && brand.radius[b.radius] ? `border-radius:${brand.radius[b.radius]}px` : '',
      pad ? `padding:${pad}px` : '',
    ].filter(Boolean).join(';');
    return table(row(inner, ` style="${styles}"${b.fill ? ` bgcolor="${col(b.fill)}"` : ''}`));
  };

  function render(b, width) {
    switch (b.type) {
      case 'stack': {
        const pad = space(b.padding);
        const inner = width - pad * 2;
        const gap = space(b.gap ?? 'm');
        let content;
        if ((b.direction || 'column') === 'column') {
          content = table(b.children.map((c, i) => (i ? gapRow(gap) : '') + row(render(c, inner), ` align="${ALIGN[b.align] || 'left'}"`)).join(''));
        } else {
          const n = b.children.length;
          const cw = Math.floor((inner - gap * (n - 1)) / n);
          content = table(
            `<tr>${b.children.map((c, i) => (i ? `<td width="${gap}" style="width:${gap}px;font-size:0;">&nbsp;</td>` : '') + `<td width="${cw}" valign="${VALIGN[b.align || 'stretch']}" style="width:${cw}px;">${render(c, cw)}</td>`).join('')}</tr>`
          );
        }
        return wrapBox(b, content, width);
      }
      case 'grid': {
        const pad = space(b.padding);
        const inner = width - pad * 2;
        const gap = space(b.gap ?? 'm');
        const n = b.columns;
        const cw = Math.floor((inner - gap * (n - 1)) / n);
        const cells = b.children.map((c) => `<td width="${cw}" valign="top" style="width:${cw}px;">${render(c, cw)}</td>`);
        const rows = [];
        for (let i = 0; i < cells.length; i += n) rows.push(`<tr>${cells.slice(i, i + n).join(`<td width="${gap}" style="width:${gap}px;font-size:0;">&nbsp;</td>`)}</tr>${gapRow(gap)}`);
        return wrapBox(b, table(rows.join('')), width);
      }
      case 'text':
        return table(row(rich(b.text), ` align="${ALIGN[b.align] || 'left'}" style="${roleCss(b.role)};color:${col(b.color)};"`));
      case 'stat':
        return table(
          row(esc(b.value), ` align="${ALIGN[b.align] || 'left'}" style="${roleCss('stat')};color:${col(b.color || 'crimson')};"`) +
            row(esc(b.label), ` align="${ALIGN[b.align] || 'left'}" style="${roleCss('caption')};color:${col(b.color || 'crimson')};padding-top:4px;"`)
        );
      case 'image': {
        const up = b.src.kind === 'upload' ? (doc.assets || {})[b.src.id] : null;
        const src = up ? renditionUrl(up, 1200) : b.src.kind === 'library' ? baseUrl + brand.images.library[b.src.key] : b.src.url;
        const alt = b.decorative ? '' : b.alt || up?.alt || '';
        const h = Math.round(width * (RATIO[b.ratio || '3:2'] || 2 / 3));
        return `<img src="${esc(src)}" alt="${esc(alt)}" width="${width}" height="${h}" style="display:block;width:100%;max-width:${width}px;height:auto;border:0;${b.radius && brand.radius[b.radius] ? `border-radius:${brand.radius[b.radius]}px;` : ''}">`;
      }
      case 'logo': {
        const h = { s: 28, m: 40, l: 64 }[b.size || 'm'];
        return table(row(`<img src="${baseUrl}${brand.images.library.lockup}" alt="${esc(brand.name)}" height="${h}" style="display:block;height:${h}px;width:auto;border:0;">`, ` align="${ALIGN[b.align] || 'left'}"`));
      }
      case 'spacer':
        return table(gapRow(space(b.size)));
      case 'divider':
        return table(`<tr><td height="1" style="height:1px;font-size:0;line-height:0;border-top:${b.weight === 'medium' ? 2 : 1}px solid ${col(b.color || 'ink')};">&nbsp;</td></tr>`);
      case 'list': {
        const mark = (i) => (b.marker === 'number' ? `${i + 1}.` : b.marker === 'dash' ? '–' : '•');
        return table(
          b.items
            .map((it, i) => `<tr><td width="22" valign="top" style="${roleCss(b.role || 'body')};color:${col(b.color)};">${mark(i)}</td><td style="${roleCss(b.role || 'body')};color:${col(b.color)};padding-bottom:4px;">${esc(it)}</td></tr>`)
            .join('')
        );
      }
      case 'button': {
        const bg = col(b.color || 'crimson');
        const solid = (b.style || 'solid') === 'solid';
        const fg = solid ? readableOn(bg, '#ffffff', col('ink')) : bg;
        return table(
          row(
            `<table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr><td bgcolor="${solid ? bg : ''}" style="${solid ? `background-color:${bg};` : ''}border:2px solid ${bg};"><a href="${esc(b.href)}" style="display:inline-block;padding:12px 24px;${roleCss('caption')};font-weight:700;color:${fg};text-decoration:none;">${esc(b.label)}</a></td></tr></table>`,
            ` align="${ALIGN[b.align] || 'left'}"`
          )
        );
      }
      default:
        return '';
    }
  }

  const page = doc.pages[0];
  const pad = format.safe;
  const bg = col(page.background);
  const inner = format.w - pad * 2;
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="x-apple-disable-message-reformatting"><title>${esc(doc.title)}</title></head>
<body style="margin:0;padding:0;background-color:${col('light')};">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${col('light')}"><tr><td align="center" style="padding:16px 8px;">
<table role="presentation" width="${format.w}" cellpadding="0" cellspacing="0" border="0" bgcolor="${bg}" style="width:${format.w}px;max-width:100%;background-color:${bg};"><tr><td style="padding:${pad}px;">
${render(page.root, inner)}
</td></tr></table>
</td></tr></table>
</body></html>`;
}
