
import styles from '../styles/button.module.css';

export default function Button({ href, children, outline = false }) {
  return (
    <a href={href} className={outline ? styles.buttonOutline : styles.button}>
      {children}
    </a>
  );
}
