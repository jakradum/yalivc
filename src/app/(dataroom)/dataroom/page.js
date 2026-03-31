import Link from 'next/link';
import { cookies } from 'next/headers';
import {
  getDataRoomDocuments,
  getDataRoomTrackRecords,
  getDataRoomTeamMembers,
  getDataRoomPortfolioCompanies,
  getPortalUserByEmail,
} from '@/lib/sanity-queries';
import DataroomTopbar from './DataroomTopbar';
import styles from './dataroom.module.css';

export const dynamic = 'force-dynamic';

const CATEGORIES = [
  {
    slug: 'pipeline',
    title: 'Pipeline',
    description: 'Deal flow and investment pipeline documentation',
    icon: 'pipeline',
  },
  {
    slug: 'ppm-agreements',
    title: 'PPM & Agreements',
    description: 'Private placement memo and contribution agreements',
    icon: 'ppm',
  },
  {
    slug: 'presentations',
    title: 'Presentations',
    description: 'Fund pitch decks and investor-facing materials',
    icon: 'presentations',
  },
  {
    slug: 'sebi',
    title: 'Regulatory Documents',
    description: 'Regulatory filings and AIF registration documents',
    icon: 'sebi',
  },
  {
    slug: 'team',
    title: 'Team',
    description: 'Investment team credentials and advisory board profiles',
    icon: 'team',
  },
  {
    slug: 'track-record',
    title: 'Track Record & Recommendation',
    description:
      'Historical investments, exit performance, and third-party references',
    icon: 'chart',
  },
  {
    slug: 'fund-performance',
    title: 'Fund Performance',
    description: 'Headline fund metrics and performance indicators',
    icon: 'chart',
  },
  {
    slug: 'category-split',
    title: 'Portfolio by Sector',
    description: 'Investment distribution across active portfolio companies',
    icon: 'pie',
  },
];

function CategoryIcon({ icon }) {
  switch (icon) {
    case 'pipeline':
      return (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M4 2h6l3 3v9H4V2z" stroke="currentColor" strokeWidth="1.2" fill="none" />
          <line x1="6" y1="6.5" x2="10.5" y2="6.5" stroke="currentColor" strokeWidth="0.9" opacity="0.7" />
          <line x1="6" y1="9" x2="10.5" y2="9" stroke="currentColor" strokeWidth="0.9" opacity="0.7" />
          <line x1="6" y1="11" x2="8.5" y2="11" stroke="currentColor" strokeWidth="0.9" opacity="0.7" />
        </svg>
      );
    case 'ppm':
      return (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <rect x="2" y="3" width="12" height="10" stroke="currentColor" strokeWidth="1.2" fill="none" />
          <line x1="5" y1="7" x2="11" y2="7" stroke="currentColor" strokeWidth="0.9" opacity="0.7" />
          <line x1="5" y1="9.5" x2="9" y2="9.5" stroke="currentColor" strokeWidth="0.9" opacity="0.7" />
        </svg>
      );
    case 'presentations':
      return (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <rect x="2" y="2" width="12" height="9" stroke="currentColor" strokeWidth="1.2" fill="none" />
          <line x1="8" y1="11" x2="8" y2="14" stroke="currentColor" strokeWidth="1.2" />
          <line x1="5" y1="14" x2="11" y2="14" stroke="currentColor" strokeWidth="1.2" />
        </svg>
      );
    case 'recommendation':
      return (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <circle cx="8" cy="5.5" r="2.5" stroke="currentColor" strokeWidth="1.2" fill="none" />
          <path d="M3 14c0-2.76 2.24-4 5-4s5 1.24 5 4" stroke="currentColor" strokeWidth="1.2" fill="none" />
        </svg>
      );
    case 'sebi':
      return (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M8 2l1 3h3l-2.5 2 1 3L8 8.5 5.5 10l1-3L4 5h3z" stroke="currentColor" strokeWidth="1.1" fill="none" />
        </svg>
      );
    case 'team':
      return (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <circle cx="5" cy="6" r="2" stroke="currentColor" strokeWidth="1.1" fill="none" />
          <circle cx="11" cy="6" r="2" stroke="currentColor" strokeWidth="1.1" fill="none" />
          <path d="M2 14c0-1.66 1.34-3 3-3s3 1.34 3 3" stroke="currentColor" strokeWidth="1.1" fill="none" />
          <path d="M8 14c0-1.66 1.34-3 3-3s3 1.34 3 3" stroke="currentColor" strokeWidth="1.1" fill="none" />
        </svg>
      );
    case 'chart':
      return (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <polyline points="2,12 5,8 8,10 11,5 14,7" stroke="currentColor" strokeWidth="1.2" fill="none" />
          <circle cx="14" cy="7" r="1.2" fill="currentColor" opacity="0.7" />
        </svg>
      );
    case 'pie':
      return (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M8 2v6l4.5 4.5" stroke="currentColor" strokeWidth="1.2" fill="none"/>
          <circle cx="8" cy="8" r="5.5" stroke="currentColor" strokeWidth="1.2" fill="none"/>
        </svg>
      );
    case 'briefcase':
      return (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <rect x="2" y="5" width="12" height="9" stroke="currentColor" strokeWidth="1.2" fill="none"/>
          <path d="M5 5V4a3 3 0 0 1 6 0v1" stroke="currentColor" strokeWidth="1.2" fill="none"/>
          <line x1="2" y1="9" x2="14" y2="9" stroke="currentColor" strokeWidth="0.9" opacity="0.5"/>
        </svg>
      );
    default:
      return null;
  }
}

export default async function DataroomPage() {
  // Check allAccess for portfolio card
  const cookieStore = await cookies();
  const session = cookieStore.get('dataroom-session')?.value;
  const email = session ? session.split(':')[0] : null;
  const user = email ? await getPortalUserByEmail(email) : null;
  const hasAllAccess = user?.allAccess || false;

  const [docs, trackRecords, teamMembers, portfolioCompanies] = await Promise.all([
    getDataRoomDocuments(),
    getDataRoomTrackRecords(),
    getDataRoomTeamMembers(),
    getDataRoomPortfolioCompanies(),
  ]);

  const allDocs = docs || [];
  const allTrackRecords = trackRecords || [];
  const allTeamMembers = teamMembers || [];
  const allPortfolioCompanies = portfolioCompanies || [];

  // Build display categories — conditionally include portfolio for allAccess users
  const displayCategories = [
    ...CATEGORIES,
    ...(hasAllAccess ? [{
      slug: 'portfolio',
      title: 'Portfolio',
      description: 'Active portfolio company performance and metrics',
      icon: 'briefcase',
    }] : []),
  ].map((cat, idx, arr) => idx === arr.length - 1 ? { ...cat, last: true } : cat);

  // Compute per-category counts
  function getCount(cat) {
    if (cat.slug === 'team') return allTeamMembers.length;
    if (cat.slug === 'track-record') return allTrackRecords.length + allDocs.filter((d) => d.category === 'recommendation').length;
    if (cat.slug === 'category-split') return allPortfolioCompanies.length;
    if (cat.slug === 'portfolio') return allPortfolioCompanies.length;
    if (cat.slug === 'fund-performance') return null;
    return allDocs.filter((d) => d.category === cat.slug).length;
  }

  function getCountLabel(cat) {
    if (cat.slug === 'team') return 'profiles';
    if (cat.slug === 'track-record') return 'items';
    if (cat.slug === 'fund-performance') return 'metrics';
    if (cat.slug === 'category-split') return 'active companies';
    if (cat.slug === 'portfolio') return 'companies';
    return 'documents';
  }

  // Last updated from max publishedAt
  const dates = allDocs
    .map((d) => d.publishedAt)
    .filter(Boolean)
    .sort()
    .reverse();
  const lastUpdated = dates[0]
    ? new Date(dates[0]).toLocaleDateString('en-GB', {
        month: 'short',
        year: 'numeric',
      })
    : null;

  return (
    <div className={styles.page}>
      <DataroomTopbar />
      <div className={styles.hero}>
        <div>
          <div className={styles.heroTitle}>Investor Virtual Data Room</div>
          <div className={styles.heroSub}>Select a category to browse documents</div>
        </div>
        {lastUpdated && (
          <div className={styles.lastUpdated}>Last updated {lastUpdated}</div>
        )}
      </div>
      <div className={styles.content}>
        <div className={styles.sectionLabel}>Categories</div>
        <div className={styles.grid}>
          {displayCategories.map((cat) => {
            const count = getCount(cat);
            const label = getCountLabel(cat);
            return (
              <Link
                key={cat.slug}
                href={`/dataroom/${cat.slug}`}
                className={`${styles.card}${cat.last ? ' ' + styles.cardLast : ''}`}
              >
                <div className={styles.cardIcon}>
                  <CategoryIcon icon={cat.icon} />
                </div>
                <div className={styles.cardTitle}>{cat.title}</div>
                <div className={styles.cardDesc}>{cat.description}</div>
                <div className={styles.cardFooter}>
                  <div className={styles.cardCount}>
                    {count != null ? `${count} ${label}` : ''}
                  </div>
                  <div className={styles.cardArrow}>&#x2192;</div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
