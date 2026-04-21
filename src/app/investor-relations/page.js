import styles from '../about-yali/about-styles.module.css';
import localStyles from './investor-relations.module.css';
import { getInvestorRelationsDocs } from '@/lib/sanity-queries';

export const revalidate = 60;

export const metadata = {
  title: 'Investor Relations | Yali Capital - SEBI Registered AIF',
  description: 'Yali Deeptech Fund I investor relations. SEBI registered Category II Alternative Investment Fund. Contact our compliance team for investor inquiries and grievances.',
  keywords: 'Yali Capital investor relations, SEBI registered AIF, alternative investment fund India, deep tech fund investor, Yali Ventures',
  alternates: {
    canonical: 'https://yali.vc/investor-relations/',
  },
};

export default async function InvestorRelations() {
  const irContent = await getInvestorRelationsDocs();
  const docs = irContent?.documents?.filter(d => d.fileUrl) ?? [];

  return (
    <section>
      <div className={`${styles.mainAbout} ${localStyles.noBottomBorder}`}>
        <article className={styles.textContent}>
          <h1>Investor Relations</h1>

          <h2>Yali Deeptech Fund I</h2>
          <p>
            <strong>Registration Number:</strong> IN/AIF2/23-24/1438 (a scheme of Yali Ventures)<br />
            <strong>Fund Category:</strong> Category-II<br />
            <strong>Registered Office:</strong> No. 505, B Block, 3rd Cross, AECS Layout, Kundalahalli, Bengaluru, Karnataka, India – 560037<br />
            <strong>Investment Manager:</strong> Yali Partners LLP
          </p>

          <h2>Yali Deeptech I (GIFT City)</h2>
          <p>
            <strong>Registration Number:</strong> IFSC/AIF2/2024-25/0149 (a scheme of Yali Ventures)<br />
            <strong>Fund Category:</strong> Category-II<br />
            <strong>Registered Office:</strong> Unit No. B-129, Ground Floor, Nila Spaces, Plot No. T1–T4, Road 1A, Block 11, Zone 1, SEZ-PA, GIFT City, Gandhinagar, Gujarat, India – 382355<br />
            <strong>Investment Manager:</strong> Yali Partners LLP
          </p>

          <h2>Investor Grievance</h2>
          <p>For investor grievances, please contact:</p>

          <p>
            <strong>a) Complaint Redressal Officer (CRO)</strong><br />
            Name: Mr. Ajay Soni<br />
            Email: <a href="mailto:ajay@yali.vc">ajay@yali.vc</a><br />
            Mobile: <a href="tel:+918452083566">84520 83566</a>
          </p>

          <p>
            <strong>b) Complaint Redressal Appellate Officer (CRAO)</strong><br />
            Name: Mr. Naveen Jain<br />
            Email: <a href="mailto:naveen@florintree.com">naveen@florintree.com</a><br />
            Mobile: <a href="tel:+919930421211">99304 21211</a>
          </p>

          <h2>Fund Details (GIFT City)</h2>
          <p>
            <strong>Name of the Fund:</strong> Yali Deeptech I<br />
            <strong>Registration Number:</strong> IFSC/AIF2/2024-25/0149<br />
            <strong>Category of the AIF:</strong> Category II Fund<br />
            <strong>Registered Office:</strong> Unit No. B-129, Ground Floor, Plot No. T1 &amp; T4, Road 1A, Block 11, Zone 1, SEZ-PA, Gandhinagar – 382355, Gujarat<br />
            <strong>Name of the FME:</strong> Yali Partners LLP (IFSC Branch)
          </p>

          <h2>Grievance Redressal</h2>
          <p>Dear Investors,</p>
          <p>
            At Yali Ventures, investor satisfaction is our foremost agenda. In case of any grievance or complaint:
          </p>
          <ul>
            <li>
              Please contact our compliance officer Mr. Sunil S Patil at{' '}
              <a href="mailto:sunil@yali.vc">sunil@yali.vc</a>. You may also approach Mr. Ganapathy Subramaniam at{' '}
              <a href="mailto:gani@yali.vc">gani@yali.vc</a>.
            </li>
            <li>
              If you are not satisfied with our response, you may lodge your grievance with SEBI at{' '}
              <a href="https://scores.sebi.gov.in" target="_blank" rel="noopener noreferrer">
                https://scores.sebi.gov.in
              </a>{' '}
              or write to any of the offices of SEBI. For queries, feedback or assistance, please contact the SEBI
              office on the toll-free Helpline at <a href="tel:18002227575">1800 22 7575</a> /{' '}
              <a href="tel:18002667575">1800 266 7575</a>.
            </li>
            <li>
              If you are still not satisfied with the resolution through the SCORES portal, you may initiate dispute
              resolution through the ODR portal at{' '}
              <a href="https://smartodr.in/login" target="_blank" rel="noopener noreferrer">
                https://smartodr.in/login
              </a>.
            </li>
          </ul>

          <p>
            <strong>Note:</strong> Dispute resolution through ODR will not be possible if:
          </p>
          <ul>
            <li>The complaint or grievance has not been raised with the compliance officer first and subsequently on the SCORES portal.</li>
            <li>The dispute is pending before any arbitral process, court, or tribunal.</li>
            <li>The dispute is non-arbitrable under Indian law.</li>
            <li>The dispute is time-barred under the law of limitation.</li>
          </ul>

          <p>Thank you,<br />Team Yali</p>

          <h2>Trend of Annual Disposal of Complaints</h2>
          <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch', marginTop: '1rem' }}>
            <table style={{ borderCollapse: 'collapse', width: '100%', minWidth: '520px' }}>
              <thead>
                <tr>
                  <th style={{ border: '1px solid #363636', padding: '0.75rem 1rem', textAlign: 'center', fontWeight: 500 }}>Sr. No.</th>
                  <th style={{ border: '1px solid #363636', padding: '0.75rem 1rem', textAlign: 'center', fontWeight: 500 }}>Financial Year</th>
                  <th style={{ border: '1px solid #363636', padding: '0.75rem 1rem', textAlign: 'center', fontWeight: 500 }}>Carried forward from previous year</th>
                  <th style={{ border: '1px solid #363636', padding: '0.75rem 1rem', textAlign: 'center', fontWeight: 500 }}>Received</th>
                  <th style={{ border: '1px solid #363636', padding: '0.75rem 1rem', textAlign: 'center', fontWeight: 500 }}>Resolved</th>
                  <th style={{ border: '1px solid #363636', padding: '0.75rem 1rem', textAlign: 'center', fontWeight: 500 }}>Pending</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ border: '1px solid #363636', padding: '0.75rem 1rem', textAlign: 'center' }}>1</td>
                  <td style={{ border: '1px solid #363636', padding: '0.75rem 1rem', textAlign: 'center' }}>2025-26</td>
                  <td style={{ border: '1px solid #363636', padding: '0.75rem 1rem', textAlign: 'center' }}>0</td>
                  <td style={{ border: '1px solid #363636', padding: '0.75rem 1rem', textAlign: 'center' }}>0</td>
                  <td style={{ border: '1px solid #363636', padding: '0.75rem 1rem', textAlign: 'center' }}>0</td>
                  <td style={{ border: '1px solid #363636', padding: '0.75rem 1rem', textAlign: 'center' }}>0</td>
                </tr>
                <tr>
                  <td style={{ border: '1px solid #363636', padding: '0.75rem 1rem', textAlign: 'center' }}>2</td>
                  <td style={{ border: '1px solid #363636', padding: '0.75rem 1rem', textAlign: 'center' }}>2024-25</td>
                  <td style={{ border: '1px solid #363636', padding: '0.75rem 1rem', textAlign: 'center' }}>0</td>
                  <td style={{ border: '1px solid #363636', padding: '0.75rem 1rem', textAlign: 'center' }}>0</td>
                  <td style={{ border: '1px solid #363636', padding: '0.75rem 1rem', textAlign: 'center' }}>0</td>
                  <td style={{ border: '1px solid #363636', padding: '0.75rem 1rem', textAlign: 'center' }}>0</td>
                </tr>
              </tbody>
            </table>
          </div>

          {docs.length > 0 && (
            <>
              <h2>Documents</h2>
              <ul>
                {docs.map((doc, i) => (
                  <li key={i}>
                    <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer">
                      {doc.title}
                    </a>
                  </li>
                ))}
              </ul>
            </>
          )}
        </article>
      </div>
    </section>
  );
}
