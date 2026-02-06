import styles from '../about-yali/about-styles.module.css';

export const metadata = {
  title: 'Investor Relations | Yali Capital - SEBI Registered AIF',
  description: 'Yali Deeptech Fund I investor relations. SEBI registered Category II Alternative Investment Fund. Contact our compliance team for investor inquiries and grievances.',
  keywords: 'Yali Capital investor relations, SEBI registered AIF, alternative investment fund India, deep tech fund investor, Yali Ventures',
  alternates: {
    canonical: 'https://yali.vc/investor-relations/',
  },
};

export default function InvestorRelations() {
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
      <section>
        <article className={styles.textContent}>
          <h2>Contact Details</h2>
          <p>At Yali Ventures, investor satisfaction is our foremost agenda. In case of any grievance or complaint:</p>
          <p>
            Please contact our compliance officer Mr. Sunil S Patil at{' '}
            <a href="mailto:sunil@yali.vc">sunil@yali.vc</a>. You may also approach Mr. Ganapathy Subramaniam at{' '}
            <a href="mailto:gani@yali.vc">gani@yali.vc</a>.
          </p>
          <p>
            In case you are not satisfied with our response you can lodge your grievance with SEBI at{' '}
            <a href="https://scores.sebi.gov.in" target="_blank" rel="noopener noreferrer">
              https://scores.sebi.gov.in
            </a>{' '}
            or you may also write to any of the offices of SEBI. For any queries, feedback or assistance, please contact
            SEBI office on toll free Helpline at <a href="tel:1800227575">1800 22 7575</a> /{' '}
            <a href="tel:18002667575">1800 266 7575</a>. In case you are still not satisfied with the resolution through
            SCORES portal, you can initiate the dispute resolution through ODR portal at{' '}
            <a href="https://smartodr.in/login" target="_blank" rel="noopener noreferrer">
              https://smartodr.in/login
            </a>
            .
          </p>
          <p>
            Note: The dispute resolution through ODR will not be possible, if:
            <ul>
              <li>
                The complaint or grievance is not raised with the compliance officer first and subsequently on the
                SCORES portal.
              </li>
              <li>Dispute raised is pending before any arbitral process or court or tribunal.</li>
              <li>Dispute is non-arbitrable in terms of Indian Law.</li>
              <li>Dispute is time-barred in terms of law of limitation.</li>
            </ul>
          </p>
        </article>
      </section>
    </section>
  );
}