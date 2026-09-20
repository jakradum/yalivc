import { FORMATS, formatScale } from '../formats.js';
import { getBrand } from '../brands/index.js';
import { readableOn } from '../contrast.js';
import { renditionUrl } from '../library.js';
import { SeparatorPattern } from '@/decks/design-system/blocks/SeparatorPattern/SeparatorPattern';

// Renders a validated asset as React (preview + PNG/PDF export). It only ever
// reads brand tokens, so nothing here can produce an off-brand value; sizes
// come from the brand's type/space tables scaled by the format.
// Plain, hook-free: renders identically on the server and in the client.

const ALIGN_ITEMS = { start: 'flex-start', center: 'center', end: 'flex-end', stretch: 'stretch' };
const JUSTIFY = { start: 'flex-start', center: 'center', end: 'flex-end', between: 'space-between' };
const RATIO = { '1:1': '1 / 1', '4:5': '4 / 5', '16:9': '16 / 9', '3:2': '3 / 2', '3:4': '3 / 4' };
const ANCHOR = {
  fill: { inset: 0 },
  tl: { top: 0, left: 0 },
  tr: { top: 0, right: 0 },
  bl: { bottom: 0, left: 0 },
  br: { bottom: 0, right: 0 },
  top: { top: 0, left: 0, right: 0 },
  bottom: { bottom: 0, left: 0, right: 0 },
  center: { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' },
};

function makeCtx(doc) {
  const brand = getBrand(doc.brand);
  const format = FORMATS[doc.format];
  const scale = formatScale(format);
  const mode = format.kind === 'email' ? 'email' : 'canvas';
  const px = (n) => Math.round(n * (mode === 'email' ? 1 : scale) * 100) / 100;
  const space = (k) => px(brand.space[k || 'none'][mode]);
  const color = (k) => brand.colors[k];
  const role = (r) => {
    const t = brand.type[r];
    return {
      fontFamily: brand.fonts[t.font][mode],
      fontSize: mode === 'email' ? t.email : px(t.size),
      fontWeight: t.weight,
      lineHeight: t.lh,
      letterSpacing: t.ls ? `${t.ls}em` : undefined,
      textTransform: t.upper ? 'uppercase' : undefined,
    };
  };
  const assets = doc.assets || {};
  return { brand, format, scale, mode, px, space, color, role, assets };
}

function Highlighted({ text, ctx }) {
  const parts = String(text).split('==');
  return parts.map((seg, i) =>
    i % 2 === 1 && parts.length % 2 === 1 ? (
      <span key={i} style={{ background: ctx.color('gold'), color: ctx.color('ink'), padding: `0 ${ctx.px(6)}px` }}>
        {seg}
      </span>
    ) : (
      seg
    )
  );
}

function Block({ b, ctx, parentLayer }) {
  const { brand } = ctx;
  const layerPos = parentLayer ? { position: 'absolute', ...ANCHOR[b.anchor || 'fill'], ...(b.inset && b.anchor !== 'center' ? { margin: ctx.space(b.inset) } : {}) } : null;
  const wrap = (node, style) => (layerPos ? <div style={{ ...layerPos, ...style }}>{node}</div> : node);
  const kids = (b.children || []).map((c) => <Block key={c.id} b={c} ctx={ctx} parentLayer={b.type === 'layer'} />);

  switch (b.type) {
    case 'stack': {
      const col = (b.direction || 'column') === 'column';
      return wrap(
        <div
          style={{
            display: 'flex',
            flexDirection: col ? 'column' : 'row',
            gap: ctx.space(b.gap ?? 'm'),
            padding: ctx.space(b.padding),
            alignItems: ALIGN_ITEMS[b.align || 'stretch'],
            justifyContent: JUSTIFY[b.justify || 'start'],
            background: b.fill ? ctx.color(b.fill) : undefined,
            border: b.border ? `${ctx.px(2)}px solid ${ctx.color(b.border)}` : undefined,
            borderRadius: ctx.px(brand.radius[b.radius || 'none']),
            flex: b.grow ? '1 1 0' : undefined,
            minWidth: 0,
            minHeight: 0,
            boxSizing: 'border-box',
          }}
        >
          {kids}
        </div>
      );
    }
    case 'grid':
      return wrap(
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${b.columns}, minmax(0, 1fr))`,
            gap: ctx.space(b.gap ?? 'm'),
            padding: ctx.space(b.padding),
            background: b.fill ? ctx.color(b.fill) : undefined,
            border: b.border ? `${ctx.px(2)}px solid ${ctx.color(b.border)}` : undefined,
            borderRadius: ctx.px(brand.radius[b.radius || 'none']),
            boxSizing: 'border-box',
          }}
        >
          {kids}
        </div>
      );
    case 'layer': {
      const fillHeight = (b.ratio || 'fill') === 'fill';
      return wrap(
        <div
          style={{
            position: 'relative',
            overflow: 'hidden',
            aspectRatio: fillHeight ? undefined : RATIO[b.ratio],
            flex: fillHeight ? '1 1 0' : undefined,
            minHeight: 0,
            background: b.fill ? ctx.color(b.fill) : undefined,
            borderRadius: ctx.px(brand.radius[b.radius || 'none']),
          }}
        >
          {kids}
        </div>
      );
    }
    case 'text':
      return wrap(
        <div style={{ ...ctx.role(b.role), color: ctx.color(b.color), textAlign: b.align === 'center' ? 'center' : b.align === 'end' ? 'right' : 'left', whiteSpace: 'pre-line', overflowWrap: 'break-word' }}>
          <Highlighted text={b.text} ctx={ctx} />
        </div>
      );
    case 'stat':
      return wrap(
        <div style={{ textAlign: b.align === 'center' ? 'center' : b.align === 'end' ? 'right' : 'left' }}>
          <div style={{ ...ctx.role('stat'), color: ctx.color(b.color || 'crimson') }}>{b.value}</div>
          <div style={{ ...ctx.role('caption'), color: ctx.color(b.color || 'crimson'), marginTop: ctx.space('xs') }}>{b.label}</div>
        </div>
      );
    case 'image': {
      const up = b.src.kind === 'upload' ? ctx.assets[b.src.id] : null;
      const src = up ? renditionUrl(up, 2000) : b.src.kind === 'library' ? brand.images.library[b.src.key] : b.src.url;
      return wrap(
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={b.decorative ? '' : b.alt || up?.alt || ''}
          style={{ display: 'block', width: '100%', height: layerPos ? '100%' : undefined, aspectRatio: layerPos ? undefined : RATIO[b.ratio || '3:2'], objectFit: b.fit || 'cover', borderRadius: ctx.px(brand.radius[b.radius || 'none']), filter: b.tone === 'grayscale' ? 'grayscale(1) contrast(1.15)' : undefined }}
        />
      );
    }
    case 'logo': {
      const h = { s: 48, m: 72, l: 112 }[b.size || 'm'];
      const src = brand.images.library[b.variant === 'lockup' ? 'lockup' : 'mark'];
      return wrap(
        <div style={{ display: 'flex', justifyContent: ALIGN_ITEMS[b.align || 'start'] }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src} alt={brand.name} style={{ height: ctx.px(h), width: 'auto', display: 'block', filter: b.tone === 'dark' ? 'brightness(0) invert(1)' : undefined }} />
        </div>
      );
    }
    case 'shape': {
      if (b.kind === 'scrim') return <div style={{ position: 'absolute', inset: 0, background: ctx.color(b.color), opacity: b.opacity ?? 0.5 }} />;
      const len = { s: 60, m: 100, l: 160 }[b.size || 'm'];
      const style = b.kind === 'bar' ? { width: ctx.px(len), height: ctx.px(8) } : { width: ctx.px(len / 3), height: ctx.px(len / 3), borderRadius: '50%' };
      return wrap(<div style={{ ...style, background: ctx.color(b.color), opacity: b.opacity ?? 1 }} />);
    }
    case 'pattern':
      return <div style={{ position: 'absolute', inset: 0, opacity: b.opacity ?? 0.5, pointerEvents: 'none' }}><SeparatorPattern pattern={b.name} color={ctx.color(b.color || 'gold')} fill /></div>;
    case 'spacer':
      return wrap(<div style={{ height: ctx.space(b.size), flexShrink: 0 }} />);
    case 'divider':
      return wrap(<div style={{ borderTop: `${ctx.px(b.weight === 'medium' ? 3 : 1.5)}px solid ${ctx.color(b.color || 'ink')}`, flexShrink: 0 }} />);
    case 'list': {
      const mark = (i) => (b.marker === 'number' ? `${i + 1}.` : b.marker === 'dash' ? '–' : '•');
      return wrap(
        <div style={{ display: 'flex', flexDirection: 'column', gap: ctx.space('xs') }}>
          {b.items.map((it, i) => (
            <div key={i} style={{ ...ctx.role(b.role || 'body'), color: ctx.color(b.color), display: 'flex', gap: ctx.space('s') }}>
              <span style={{ flexShrink: 0, minWidth: ctx.px(28) }}>{mark(i)}</span>
              <span>{it}</span>
            </div>
          ))}
        </div>
      );
    }
    case 'button': {
      const solid = (b.style || 'solid') === 'solid';
      const bg = ctx.color(b.color || 'crimson');
      return wrap(
        <div style={{ display: 'flex', justifyContent: ALIGN_ITEMS[b.align || 'start'] }}>
          <a
            href={b.href}
            style={{ ...ctx.role('caption'), fontWeight: 700, textDecoration: 'none', padding: `${ctx.px(18)}px ${ctx.px(36)}px`, background: solid ? bg : 'transparent', color: solid ? readableOn(bg, '#ffffff', ctx.color('ink')) : bg, border: `${ctx.px(2)}px solid ${bg}`, display: 'inline-block' }}
          >
            {b.label}
          </a>
        </div>
      );
    }
    default:
      return null;
  }
}

export function AssetPage({ doc, page, ctx = makeCtx(doc) }) {
  const { format } = ctx;
  const isEmail = format.kind === 'email';
  const pad = {
    paddingTop: ctx.px(format.safeTop || format.safe),
    paddingBottom: ctx.px(format.safeBottom || format.safe),
    paddingLeft: ctx.px(format.safe),
    paddingRight: ctx.px(format.safe),
  };
  return (
    <section
      data-asset-page={page.id}
      style={{ width: format.w, height: isEmail ? undefined : format.h, minHeight: isEmail ? 200 : undefined, background: ctx.color(page.background), position: 'relative', overflow: 'hidden', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', flexShrink: 0, ...pad }}
    >
      <Block b={{ ...page.root, grow: true }} ctx={ctx} />
    </section>
  );
}

// All pages, stacked. `gap` separates them in the preview only.
export function AssetRenderer({ doc, gap = 24 }) {
  const ctx = makeCtx(doc);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap }}>
      {doc.pages.map((p) => (
        <AssetPage key={p.id} doc={doc} page={p} ctx={ctx} />
      ))}
    </div>
  );
}
