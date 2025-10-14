
import styles from '../styles/button.module.css';
import { ArrowLinkOpen } from './icons/small icons/arrowLinkOpen';

export default function Button({ href, children, color = '#000000', target }) {
  return (
    <a href={href} className={styles.button} style={{ color: color }} target={target} rel={target === '_blank' ? 'noopener noreferrer' : undefined}>
      <span className={styles.text}>{children}</span>
      <ArrowLinkOpen/>
    </a>
  );
}