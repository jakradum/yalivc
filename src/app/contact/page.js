import styles from '../about-yali/about styles.module.css'

export default function Contact() {
  return (
    <div 
      className={styles.sectionLevel}
      style={{
        width: '100%',
        height: '100vh',
        overflow: 'hidden',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',

        boxSizing: 'border-box', // Include padding in width calculation
      }}
    >
      <div style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <iframe
          src="https://forms.office.com/Pages/ResponsePage.aspx?id=DQSIkWdsW0yxEjajBLZtrQAAAAAAAAAAAAMAAAdeau5UOEJaUjNKOFU2RVNPRFlYUUhNWkNLR0NKTC4u&embed=true"
          frameBorder="0"
          marginWidth="0"
          marginHeight="0"
          style={{
            border: 'none',
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
          }}
          allowFullScreen
          webkitallowfullscreen="true"
          mozallowfullscreen="true"
          msallowfullscreen="true"
        >
        </iframe>
      </div>
    </div>
  );
}