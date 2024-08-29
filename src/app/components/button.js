
import styles from '../styles/button.module.css';

export default function Button({ href, children, color = '#000000' }) {
  return (
    <a href={href} className={styles.button} style={{ color: color }}>
      <span className={styles.text}>{children}</span>
      <svg 
        className={styles.arrow} 
        width="24" 
        height="24" 
        viewBox="0 0 24 24" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
      >
        <path 
          d="M7 17L17 7M17 7H7M17 7V17" 
          stroke={color} 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round"
        />
      </svg>
    </a>
  );
}