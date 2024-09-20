import styles from '../about-yali/about styles.module.css';


export default function page(){
  return (
    <section className={styles.sectionLevel}>
      <div className={styles.mainAbout}>
        <article className={styles.textContent}>
          <h1>Investor relations</h1>
          <p>
            Yali Deeptech Fund I ("Fund"), (a scheme of Yali Ventures)("Trust") is registered with SEBI as a Category II
            Alternative Investment Fund with effect from 29 January 2024 with the Registration Number
            IN/AIF2/23-24/1438.
          </p>

          <p>
            The registered office of the Fund is at No. 505, B Block, 3rd Cross, AECS Layout, Kundalahalli, Bengaluru -
            560037, Karnataka, India. Yali Partners LLP is the Investment Manager, Amicorp Trustees (India) Private
            Limited is the Trustee and Yali Sponsors LLP is the Sponsor to the Fund
          </p>
        </article>
      </div>
    </section>
  );
}

