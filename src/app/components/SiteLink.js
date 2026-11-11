import Link from 'next/link';
import styles from '../styles/button.module.css';
import { ArrowLinkOpen } from './icons/small-icons/arrowLinkOpen';

// The main site's link look (same styles as components/button.js): light uppercase text
// with an underline that retracts on hover. Only links that open another site carry the
// open-in-new-tab icon; links inside the site are text alone.
//   href + external  → <a target="_blank"> with the icon
//   href             → Next <Link>
//   onClick, no href → <button>
//   inline           → keeps the desktop look on phones (no box), for links inside text or tables
export default function SiteLink({ href, onClick, external = false, inline = false, color = '#830D35', className = '', children, ...rest }) {
  const cls = [styles.button, inline ? styles.inline : '', !href ? styles.asButton : '', className].filter(Boolean).join(' ');
  const text = <span className={styles.text}>{children}</span>;
  if (!href) {
    return <button type="button" className={cls} style={{ color }} onClick={onClick} {...rest}>{text}</button>;
  }
  if (external) {
    return (
      <a href={href} className={cls} style={{ color }} target="_blank" rel="noopener noreferrer" onClick={onClick} {...rest}>
        {text}
        <ArrowLinkOpen />
      </a>
    );
  }
  return <Link href={href} className={cls} style={{ color }} onClick={onClick} {...rest}>{text}</Link>;
}
