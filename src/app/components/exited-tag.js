import styles from './exited-tag.module.css';

/**
 * ExitedTag — marker shown next to a company name once Yali has exited.
 *
 * Drop it in wherever a company name is rendered and pass the company's
 * status. It renders nothing unless the company is actually exited, so call
 * sites don't need their own guard:
 *
 *   <ExitedTag exited={company.investmentStatus === 'exited'} />
 *
 * @param {boolean} exited  Whether to render. Defaults to true so it can also
 *                          be used inside a caller-side conditional.
 * @param {'sm'|'md'|'lg'} size  Visual size. Defaults to 'md'.
 * @param {'ink'|'inherit'} tone  'ink' = fixed #363636 (default). 'inherit' =
 *                          follow surrounding text colour, for use over dark
 *                          backgrounds (e.g. the company-page hero on mobile).
 * @param {string} className  Optional extra class on the tag element.
 */
export default function ExitedTag({ exited = true, size = 'md', tone = 'ink', className = '' }) {
  if (!exited) return null;

  const toneClass = tone === 'inherit' ? styles.inherit : '';

  return (
    <span className={`${styles.tag} ${styles[size] || styles.md} ${toneClass} ${className}`.trim()}>
      Exited
    </span>
  );
}
