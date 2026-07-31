import { notFound } from 'next/navigation';
import { getLetterBySlug } from '@/lib/sanity-queries';
import PrintButton from './PrintButton';

export const dynamic = 'force-dynamic';

function formatDate(dateStr) {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-').map(Number);
  const d = new Date(year, month - 1, day);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
}

function renderBody(blocks) {
  if (!blocks || !blocks.length) return null;
  return blocks.map((block, i) => {
    if (block._type !== 'block') return null;
    const text = (block.children || []).map((span, j) => {
      let content = span.text || '';
      const marks = span.marks || [];
      if (marks.includes('strong')) content = <strong key={j}>{content}</strong>;
      else if (marks.includes('em')) content = <em key={j}>{content}</em>;
      else if (marks.includes('underline')) content = <u key={j}>{content}</u>;
      else content = <span key={j}>{content}</span>;
      return content;
    });
    return <p key={i}>{text}</p>;
  });
}

export default async function LetterPage({ params }) {
  const { slug } = await params;
  const letter = await getLetterBySlug(slug);
  if (!letter) notFound();

  const css = `
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    @page { size: A4; margin: 0; }
    body { background: #d0d0d0; font-family: var(--font-inter, 'Inter', sans-serif); color: #363636; padding: 40px 20px 80px; }
    .letter-page { background: #faf8f5; width: 794px; min-height: 1123px; margin: 0 auto 32px; display: flex; flex-direction: column; }
    .letter-header { padding: 44px 56px 28px; display: flex; align-items: flex-start; justify-content: space-between; flex-shrink: 0; }
    .letter-logo { width: 96px; height: auto; }
    .header-meta { text-align: right; padding-top: 6px; }
    .header-meta-row { display: flex; align-items: baseline; justify-content: flex-end; gap: 8px; margin-bottom: 3px; }
    .meta-label { font-family: var(--font-jetbrains-mono, 'JetBrains Mono', monospace); font-size: 9px; font-weight: 700; letter-spacing: 0.18em; text-transform: uppercase; color: #363636; }
    .meta-sep { font-family: var(--font-jetbrains-mono, 'JetBrains Mono', monospace); font-size: 9px; color: #aaa; }
    .meta-val { font-family: var(--font-jetbrains-mono, 'JetBrains Mono', monospace); font-size: 9px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; color: #363636; }
    .header-rule { margin: 0 56px; border: none; border-top: 1px solid #c8c0b4; flex-shrink: 0; }
    .letter-content { padding: 48px 56px 40px; flex: 1; }
    .salutation { font-family: var(--font-inter, 'Inter', sans-serif); font-size: 12px; color: #363636; margin-bottom: 8px; }
    .letter-subject { font-family: var(--font-jetbrains-mono, 'JetBrains Mono', monospace); font-size: 9.5px; font-weight: 700; letter-spacing: 0.14em; text-transform: uppercase; color: #830d35; margin-bottom: 32px; padding-bottom: 16px; border-bottom: 1px solid #c8c0b4; }
    .letter-body { font-family: var(--font-inter, 'Inter', sans-serif); font-size: 12px; line-height: 1.9; color: #363636; }
    .letter-body p { margin-bottom: 20px; }
    .closing { font-family: var(--font-inter, 'Inter', sans-serif); font-size: 12px; color: #363636; margin-top: 40px; margin-bottom: 80px; }
    .signatory-name { font-family: var(--font-jetbrains-mono, 'JetBrains Mono', monospace); font-size: 11.5px; font-weight: 700; color: #363636; letter-spacing: 0.02em; margin-bottom: 4px; }
    .signatory-role { font-family: var(--font-inter, 'Inter', sans-serif); font-size: 11px; color: #666; margin-bottom: 1px; }
    .signatory-entity { font-family: var(--font-inter, 'Inter', sans-serif); font-size: 11px; color: #666; }
    .footer-rule { margin: 0 56px; border: none; border-top: 1px solid #c8c0b4; flex-shrink: 0; }
    .letter-footer { padding: 14px 56px 20px; display: flex; align-items: center; justify-content: space-between; flex-shrink: 0; }
    .footer-left { font-family: var(--font-jetbrains-mono, 'JetBrains Mono', monospace); font-size: 8.5px; color: #888; letter-spacing: 0.1em; text-transform: uppercase; }
    .footer-right { font-family: var(--font-jetbrains-mono, 'JetBrains Mono', monospace); font-size: 8.5px; color: #888; letter-spacing: 0.06em; }
    @media print {
      body { background: white; padding: 0; }
      .letter-page { margin: 0; width: 100%; min-height: 297mm; }
    }
  `;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <PrintButton />
      <div className="letter-page">
        <div className="letter-header">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="letter-logo" src="/yali-logo.png" alt="Yali Capital" />
          <div className="header-meta">
            <div className="header-meta-row">
              <span className="meta-label">Date</span>
              <span className="meta-sep">:</span>
              <span className="meta-val">{formatDate(letter.date)}</span>
            </div>
            {letter.reference && (
              <div className="header-meta-row">
                <span className="meta-label">Ref</span>
                <span className="meta-sep">:</span>
                <span className="meta-val">{letter.reference}</span>
              </div>
            )}
          </div>
        </div>

        <hr className="header-rule" />

        <div className="letter-content">
          <div className="salutation">{letter.salutation}</div>
          <div className="letter-subject">Subject: {letter.subject}</div>
          <div className="letter-body">{renderBody(letter.body)}</div>
          <div className="closing">{letter.closing}</div>
          {letter.signatory && (
            <div>
              <div className="signatory-name">{letter.signatory.name}</div>
              <div className="signatory-role">{letter.signatory.role}</div>
              <div className="signatory-entity">Yali Partners LLP</div>
            </div>
          )}
        </div>

        <hr className="footer-rule" />

        <div className="letter-footer">
          <span className="footer-left">yali.vc</span>
          <span className="footer-right">505, 3rd Cross Road, B Block, AECS Layout, Kundalahalli, Bengaluru 560037</span>
        </div>
      </div>
    </>
  );
}
