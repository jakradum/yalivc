import styles from '../about-yali/about styles.module.css'

export default function Contact() {
  return (
    <section 
      className={styles.sectionLevel}
      style={{
        width: '100%',
        height: '100vh',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        boxSizing: 'border-box',
      }}
    >
      <div style={{
        width: '100%',
        height: 'calc(100% - 120px)', // Slightly reduce height to accommodate header
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
      <div style={{
        padding: '15px',
        textAlign: 'center',
        backgroundColor: '#f5f5f5',
        width: '100%',
        boxSizing: 'border-box',
      }}>
        <h3 style={{ margin: '0 0 10px 0', fontSize: '16px', fontWeight: 'bold' }}>
          Registered Address
        </h3>
        <p style={{ margin: 0, fontSize: '14px', lineHeight: '1.5' }}>
          No. 505, B Block, 3rd Cross, AECS Layout, Kundalahalli,<br />
          Bengaluru - 560037, Karnataka, India
        </p>
      </div>
    </section>
  );
}