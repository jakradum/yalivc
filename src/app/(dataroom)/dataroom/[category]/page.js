import { notFound } from 'next/navigation';
import Link from 'next/link';
import {
  getDataRoomDocuments,
  getDataRoomTrackRecords,
  getDataRoomTeamMembers,
} from '@/lib/sanity-queries';
import DataroomTopbar from '../DataroomTopbar';
import styles from '../dataroom.module.css';

export const dynamic = 'force-dynamic';

const SLUG_TO_TITLE = {
  pipeline: 'Pipeline',
  'ppm-agreements': 'PPM & Agreements',
  presentations: 'Presentations',
  recommendation: 'Recommendation',
  sebi: 'SEBI',
  team: 'Team',
  'track-record': 'Track Record',
};

const DOC_CATEGORIES = new Set([
  'pipeline',
  'ppm-agreements',
  'presentations',
  'recommendation',
  'sebi',
]);

const DocIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path
      d="M4 2h6l3 3v9H4V2z"
      stroke="#efefef"
      strokeWidth="1.2"
      fill="none"
      opacity="0.7"
    />
  </svg>
);

function formatDate(dateStr) {
  if (!dateStr) return null;
  return new Date(dateStr).toLocaleDateString('en-GB', {
    month: 'short',
    year: 'numeric',
  });
}

function formatMoney(money) {
  if (!money || money.value == null) return '—';
  const { currency, value } = money;
  if (currency === 'INR') {
    if (value >= 1e7) return `₹${(value / 1e7).toFixed(1)} cr`;
    if (value >= 1e5) return `₹${(value / 1e5).toFixed(1)} L`;
    return `₹${value.toLocaleString('en-IN')}`;
  }
  if (value >= 1e6) return `$${(value / 1e6).toFixed(1)}M`;
  if (value >= 1e3) return `$${Math.round(value / 1e3)}K`;
  return `$${value.toLocaleString()}`;
}

function TrackStatusBadge({ status }) {
  if (!status) return <span>—</span>;
  return (
    <span className={styles.trackStatus} data-status={status}>
      {status}
    </span>
  );
}

export default async function CategoryPage({ params }) {
  const { category: slug } = await params;

  if (!SLUG_TO_TITLE[slug]) {
    notFound();
  }

  const categoryTitle = SLUG_TO_TITLE[slug];

  if (slug === 'team') {
    const members = (await getDataRoomTeamMembers()) || [];
    return (
      <div className={styles.page}>
        <DataroomTopbar />
        <div className={styles.breadcrumb}>
          <Link href="/dataroom" className={styles.breadcrumbBack}>
            ← Data Room
          </Link>
          <span className={styles.breadcrumbSep}>/</span>
          <span className={styles.breadcrumbCurrent}>{categoryTitle}</span>
        </div>
        <div className={styles.innerHero}>
          <div>
            <div className={styles.innerTitle}>{categoryTitle}</div>
            <div className={styles.innerSub}>
              Browse and open documents in this category
            </div>
          </div>
          <div className={styles.docCountBadge}>
            {members.length} profiles
          </div>
        </div>
        <div className={styles.teamGrid}>
          {members.map((m) => (
            <div key={m._id} className={styles.teamCard}>
              {m.photo && (
                <img
                  src={m.photo}
                  alt={m.name}
                  className={styles.teamPhoto}
                />
              )}
              <div className={styles.teamName}>{m.name}</div>
              <div className={styles.teamRole}>{m.role}</div>
              {m.linkedIn && (
                <a
                  href={m.linkedIn}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.teamLinkedIn}
                >
                  LinkedIn &#x2192;
                </a>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (slug === 'track-record') {
    const records = (await getDataRoomTrackRecords()) || [];

    // Group by investor name — Ganapathy first, Mathew second, others after
    const investorOrder = (name) => {
      if (!name) return 99;
      const lower = name.toLowerCase();
      if (lower.includes('ganapathy')) return 0;
      if (lower.includes('mathew')) return 1;
      return 2;
    };

    const grouped = {};
    for (const r of records) {
      const key = r.investorName || 'Unknown';
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(r);
    }

    const sortedInvestors = Object.keys(grouped).sort(
      (a, b) => investorOrder(a) - investorOrder(b)
    );

    return (
      <div className={styles.page}>
        <DataroomTopbar />
        <div className={styles.breadcrumb}>
          <Link href="/dataroom" className={styles.breadcrumbBack}>
            ← Data Room
          </Link>
          <span className={styles.breadcrumbSep}>/</span>
          <span className={styles.breadcrumbCurrent}>{categoryTitle}</span>
        </div>
        <div className={styles.innerHero}>
          <div>
            <div className={styles.innerTitle}>{categoryTitle}</div>
            <div className={styles.innerSub}>
              Browse and open documents in this category
            </div>
          </div>
          <div className={styles.docCountBadge}>
            {records.length} investments
          </div>
        </div>
        <div className={styles.trackSection}>
          {sortedInvestors.map((investor) => (
            <div key={investor}>
              <div className={styles.trackInvestorHeading}>{investor}</div>
              <div className={styles.trackTableWrap}>
                <table className={styles.trackTable}>
                  <thead>
                    <tr>
                      <th className={styles.trackTh}>Company</th>
                      <th className={styles.trackTh}>Fund / Org</th>
                      <th className={styles.trackTh}>Year</th>
                      <th className={styles.trackTh}>Sector</th>
                      <th className={styles.trackTh}>Amount Invested</th>
                      <th className={styles.trackTh}>Status</th>
                      <th className={styles.trackTh}>Exit Year</th>
                      <th className={styles.trackTh}>Exit Value</th>
                      <th className={styles.trackTh}>IRR</th>
                    </tr>
                  </thead>
                  <tbody>
                    {grouped[investor].map((r) => (
                      <tr key={r._id}>
                        <td className={styles.trackTd}>{r.investeeName || '—'}</td>
                        <td className={styles.trackTd}>{r.investmentOrg || '—'}</td>
                        <td className={styles.trackTd}>{r.year || '—'}</td>
                        <td className={styles.trackTd}>{r.sector || '—'}</td>
                        <td className={styles.trackTd}>{formatMoney(r.amountInvested)}</td>
                        <td className={styles.trackTd}>
                          <TrackStatusBadge status={r.status} />
                        </td>
                        <td className={styles.trackTd}>{r.exitYear || '—'}</td>
                        <td className={styles.trackTd}>{formatMoney(r.exitAmountOrValuation)}</td>
                        <td className={styles.trackTd}>{r.irr != null ? `${r.irr}%` : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Default: document list
  const allDocs = (await getDataRoomDocuments()) || [];
  const docs = allDocs.filter((d) => d.category === slug);

  return (
    <div className={styles.page}>
      <DataroomTopbar />
      <div className={styles.breadcrumb}>
        <Link href="/dataroom" className={styles.breadcrumbBack}>
          ← Data Room
        </Link>
        <span className={styles.breadcrumbSep}>/</span>
        <span className={styles.breadcrumbCurrent}>{categoryTitle}</span>
      </div>
      <div className={styles.innerHero}>
        <div>
          <div className={styles.innerTitle}>{categoryTitle}</div>
          <div className={styles.innerSub}>
            Browse and open documents in this category
          </div>
        </div>
        <div className={styles.docCountBadge}>{docs.length} documents</div>
      </div>
      <div className={styles.docList}>
        {docs.map((doc) => (
          <div key={doc._id} className={styles.docRow}>
            <div className={styles.docIcon}>
              <DocIcon />
            </div>
            <div className={styles.docInfo}>
              <div className={styles.docTitle}>{doc.title}</div>
              <div className={styles.docMeta}>
                <span>PDF</span>
                {doc.description && <span>{doc.description}</span>}
                {doc.publishedAt && <span>{formatDate(doc.publishedAt)}</span>}
              </div>
            </div>
            {doc.fileUrl && (
              <a
                href={doc.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.docOpen}
              >
                Open
              </a>
            )}
          </div>
        ))}
        {docs.length === 0 && (
          <div className={styles.docRow}>
            <div className={styles.docInfo}>
              <div className={styles.docTitleEmpty}>
                No documents available
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
