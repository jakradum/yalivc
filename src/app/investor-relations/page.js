import styles from './investor-relations.module.css';
import { getInvestorRelationsDocs } from '@/lib/sanity-queries';

export const revalidate = 60;

export const metadata = {
  title: 'Investor Relations | Yali Capital - SEBI Registered AIF',
  description: 'Yali Deeptech Fund I investor relations. SEBI registered Category II Alternative Investment Fund. Contact our compliance team for investor inquiries and grievances.',
  keywords: 'Yali Capital investor relations, SEBI registered AIF, alternative investment fund India, deep tech fund investor, Yali Ventures',
  robots: 'noindex, nofollow',
  alternates: {
    canonical: 'https://yali.vc/investor-relations/',
  },
};

export default async function InvestorRelations() {
  const irContent = await getInvestorRelationsDocs();
  const docs = irContent?.documents?.filter(d => d.fileUrl) ?? [];

  return (
    <div className={styles.page}>

      {/* Hero */}
      <div className={styles.hero}>
        <p className={styles.heroTag}>Yali Capital</p>
        <h1 className={styles.heroTitle}>Investor Relations</h1>
      </div>

      {/* Fund cards */}
      <div className={styles.fundsGrid}>
        <div className={styles.fundCard}>
          <p className={styles.fundName}>Yali Deeptech Fund I</p>
          <p className={styles.fundScheme}>a scheme of Yali Ventures</p>
          <div className={styles.fundMeta}>
            <div className={styles.fundRow}>
              <span className={styles.fundLabel}>Reg. No.</span>
              <span className={styles.fundValue}>IN/AIF2/23-24/1438</span>
            </div>
            <div className={styles.fundRow}>
              <span className={styles.fundLabel}>Category</span>
              <span className={styles.fundValue}>Category-II</span>
            </div>
            <div className={styles.fundRow}>
              <span className={styles.fundLabel}>Reg. Office</span>
              <span className={styles.fundValue}>No. 505, B Block, 3rd Cross, AECS Layout, Kundalahalli, Bengaluru, Karnataka, India – 560037</span>
            </div>
            <div className={styles.fundRow}>
              <span className={styles.fundLabel}>Inv. Manager</span>
              <span className={styles.fundValue}>Yali Partners LLP</span>
            </div>
          </div>
        </div>

        <div className={styles.fundCard}>
          <p className={styles.fundName}>Yali Deeptech I</p>
          <p className={styles.fundScheme}>a scheme of Yali Ventures</p>
          <div className={styles.fundMeta}>
            <div className={styles.fundRow}>
              <span className={styles.fundLabel}>Reg. No.</span>
              <span className={styles.fundValue}>IFSC/AIF2/2024-25/0149</span>
            </div>
            <div className={styles.fundRow}>
              <span className={styles.fundLabel}>Category</span>
              <span className={styles.fundValue}>Category-II</span>
            </div>
            <div className={styles.fundRow}>
              <span className={styles.fundLabel}>Reg. Office</span>
              <span className={styles.fundValue}>Unit No. B-129, Ground Floor, Nila Spaces, Plot No. T1–T4, Road 1A, Block 11, Zone 1, SEZ-PA, GIFT City, Gandhinagar, Gujarat, India – 382355</span>
            </div>
            <div className={styles.fundRow}>
              <span className={styles.fundLabel}>Inv. Manager</span>
              <span className={styles.fundValue}>Yali Partners LLP</span>
            </div>
          </div>
        </div>
      </div>

      {/* Letter */}
      <div className={styles.letterWrap}>
        <div className={styles.letterContent}>
          <p className={styles.letterGreeting}>Dear Investors,</p>

          <p>At Yali Ventures, investor satisfaction is our foremost agenda.</p>

          <p>In case of any investor grievance pertaining to Yali Deeptech Fund I:</p>

          <ul className={styles.letterList}>
            <li>
              Please contact our compliance officer Mr. Sunil S Patil at{' '}
              <a href="mailto:sunil@yali.vc">sunil@yali.vc</a>
            </li>
            <li>
              You may also approach Mr. Ganapathy Subramaniam at{' '}
              <a href="mailto:gani@yali.vc">gani@yali.vc</a>
            </li>
            <li>
              In case you are not satisfied with our response you can lodge your grievance with SEBI at{' '}
              <a href="https://scores.sebi.gov.in" target="_blank" rel="noopener noreferrer">https://scores.sebi.gov.in</a>{' '}
              or you may also write to any of the offices of SEBI. For any queries, feedback or assistance,
              please contact SEBI office on toll free Helpline at{' '}
              <a href="tel:18002227575">1800 22 7575</a> / <a href="tel:18002667575">1800 266 7575</a>.
            </li>
            <li>
              In case you are still not satisfied with the resolution through SCORES portal, you can initiate
              the dispute resolution through ODR portal at{' '}
              <a href="https://smartodr.in/login" target="_blank" rel="noopener noreferrer">https://smartodr.in/login</a>.
            </li>
          </ul>

          <p>
            <strong>Note:</strong> The dispute resolution through ODR will not be possible, if:
          </p>

          <ul className={styles.letterList}>
            <li>The complaint or grievance is not raised with the compliance officer first and subsequently on the SCORES portal.</li>
            <li>Dispute raised is pending before any arbitral process or court or tribunal.</li>
            <li>Dispute is non-arbitrable in terms of Indian Law.</li>
            <li>Dispute is time-barred in terms of law of limitation.</li>
          </ul>

          <p>
            In case of any investor grievance pertaining to Yali Deeptech I (GIFT City Fund), please write to us at:
          </p>

          <p className={styles.letterAddress}>
            Investor Grievance - CRO &amp; CRAO,<br />
            Yali Partners LLP, Unit No. B-129, Ground Floor, Nila Spaces, Plot No. T1-T4, Road 1A, Block 11,<br />
            Zone 1, SEZ-PA, Gift City, Gandhinagar, Gujarat, India - 382355<br />
            Email: <a href="mailto:compliance@yali.vc">compliance@yali.vc</a>
          </p>

          <p className={styles.letterClosing}>
            Thank you,<br />
            Team Yali
          </p>
        </div>
      </div>

      {/* Documents */}
      {docs.length > 0 && (
        <div className={styles.docsSection}>
          <hr className={styles.divider} />
          <p className={styles.docsSectionLabel}>Documents</p>
          {docs.map((doc, i) => (
            <a
              key={i}
              href={doc.fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.docRow}
            >
              <span className={styles.docName}>{doc.title}</span>
              <span className={styles.docArrow}>Open ↗</span>
            </a>
          ))}
        </div>
      )}

    </div>
  );
}
