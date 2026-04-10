import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import styles from './about-styles.module.css';
import { getTeamMembers } from '@/lib/sanity-queries';
import QuoteMarks from '@/app/components/icons/background svgs/quotemarks';
import HeaderFlex from '@/app/components/icons/headerflex';
import { ArrowLinkOpen } from '@/app/components/icons/small-icons/arrowLinkOpen';

export const revalidate = 60;

export const metadata = {
  title: 'About Yali Capital | Bangalore Venture Capital for Deep Tech',
  description: 'Bangalore-based venture capital firm funding India\'s deep tech companies. 60+ years of combined experience in tech investing across semiconductors, AI, robotics, genomics, and aerospace sectors.',
  keywords: 'bangalore venture capital, deep tech venture capital, tech investing in India, venture capital india, deep tech VC',
  alternates: {
    canonical: 'https://yali.vc/about-yali/',
  },
  openGraph: {
    title: 'About Yali Capital | Bangalore Venture Capital for Deep Tech',
    description: 'Bangalore-based venture capital firm funding India\'s deep tech companies. 60+ years of combined experience in tech investing.',
    url: 'https://yali.vc/about-yali/',
    type: 'website',
  },
  twitter: {
    title: 'About Yali Capital | Bangalore Venture Capital for Deep Tech',
    description: 'Bangalore-based venture capital firm funding India\'s deep tech companies. 60+ years of combined experience in tech investing.',
  },
};

function memberHref(member) {
  return member.enableTeamPage && member.slug?.current
    ? `/about-yali/${member.slug.current}`
    : null;
}

export default async function AboutYali() {
  const teamMembers = await getTeamMembers();

  const advisory    = teamMembers.filter(m => m.department === 'advisory');
  const investments = teamMembers.filter(m => m.department === 'investments');
  const operations  = teamMembers.filter(m => m.department === 'operations');

  // Sunil is operations but displayed in the investments grid before Kaushik
  const sunil = operations.find(m => m.name?.toLowerCase().includes('sunil'));
  const kaushikIndex = investments.findIndex(m => m.name?.toLowerCase().includes('kaushik'));
  const investmentsDisplay = sunil
    ? [
        ...investments.slice(0, kaushikIndex >= 0 ? kaushikIndex : investments.length),
        sunil,
        ...investments.slice(kaushikIndex >= 0 ? kaushikIndex : investments.length),
      ]
    : investments;
  const operationsDisplay = operations.filter(m => !m.name?.toLowerCase().includes('sunil'));

  return (
    <section className={styles.sectionLevel}>

      <div className={styles.headerFlexPad}>
        <HeaderFlex title="The Yali Team" />
      </div>
      <hr className={styles.fullWidthDivider} />

      {/* ── ADVISORY ── */}
      <p className={styles.sectionLabel}>Advisory</p>
      <div className={styles.advisoryGrid}>
        {advisory.map((member, index) => {
          const href = memberHref(member);
          const rowClass = index === 0 ? styles.advisoryRow1 : styles.advisoryRow2;
          const quote = member.pullQuote || member.recommendation?.text;
          const attribution = member.pullQuote
            ? member.pullQuoteAttribution
            : member.recommendation
              ? [member.recommendation.authorName, member.recommendation.authorTitle].filter(Boolean).join(', ')
              : null;
          const inner = (
            <>
              <div className={styles.advisoryPhoto}>
                {member.photo && (
                  <Image
                    src={member.photo}
                    alt={member.name}
                    fill
                    className={styles.advisoryImg}
                  />
                )}
                <div className={styles.advisoryNameOverlay}>
                  <h3 className={styles.advisoryName}>{member.name}</h3>
                  <span className={styles.advisoryRole}>{member.role}</span>
                </div>
                {href && (
                  <div className={styles.viewProfileOverlay}>
                    <span className={styles.viewProfileLabel}>View profile</span>
                    <ArrowLinkOpen />
                  </div>
                )}
              </div>
              <div className={styles.advisoryContent}>
                {quote ? (
                  <QuoteMarks className={styles.advisoryQuoteDecor} />
                ) : (
                  <div className={styles.noQuotePattern} />
                )}
                {quote && (
                  <p className={styles.advisoryQuote}>&ldquo;{quote}&rdquo;</p>
                )}
                {attribution && (
                  <span className={styles.advisoryAttribution}>{attribution}</span>
                )}
              </div>
            </>
          );
          return href ? (
            <div key={member._id} className={rowClass}>
              <Link href={href} className={styles.advisoryCard}>
                {inner}
              </Link>
            </div>
          ) : (
            <div key={member._id} className={rowClass}>
              <div className={styles.advisoryCard}>
                {inner}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── INVESTMENTS ── */}
      <div className={styles.investmentsSection}>
        <p className={styles.sectionLabel}>Investments</p>
        <div className={styles.investmentsGrid}>
          {investmentsDisplay.map((member, i) => {
            const href = memberHref(member);
            const rowIndex = Math.floor(i / 2);
            const isTinted = rowIndex % 2 === 1;
            const cardClass = isTinted
              ? `${styles.investmentsCard} ${styles.investmentsCardTinted}`
              : styles.investmentsCard;
            const quote = member.pullQuote || member.recommendation?.text;
            const attribution = member.pullQuote
              ? member.pullQuoteAttribution
              : member.recommendation
                ? [member.recommendation.authorName, member.recommendation.authorTitle].filter(Boolean).join(', ')
                : null;
            const inner = (
              <>
                <div className={styles.investmentsPhoto}>
                  {member.photo && (
                    <Image
                      src={member.photo}
                      alt={member.name}
                      fill
                      className={styles.investmentsImg}
                    />
                  )}
                  <div className={styles.investmentsNameOverlay}>
                    <h3 className={styles.investmentsName}>{member.name}</h3>
                    <span className={styles.investmentsRole}>{member.role}</span>
                  </div>
                  {href && (
                    <div className={styles.viewProfileOverlay}>
                      <span className={styles.viewProfileLabel}>View profile</span>
                      <ArrowLinkOpen />
                    </div>
                  )}
                </div>
                <div className={styles.investmentsContent}>
                  {quote ? (
                    <QuoteMarks className={styles.investmentsQuoteDecor} />
                  ) : (
                    <div className={styles.noQuotePattern} />
                  )}
                  {quote && (
                    <p className={styles.investmentsQuote}>{quote}</p>
                  )}
                  {attribution && (
                    <span className={styles.investmentsAttribution}>{attribution}</span>
                  )}
                </div>
              </>
            );
            return href ? (
              <Link key={member._id} href={href} className={cardClass}>
                {inner}
              </Link>
            ) : (
              <div key={member._id} className={cardClass}>
                {inner}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── PROWESS ── */}
      <div className={styles.prowess}>
        <p className={styles.prowessText}>
          The Yali team is built around the premise that the people backing deep tech companies should understand what it takes to build them.
        </p>
        <p className={styles.prowessText}>
          Our founding partners bring decades of hands-on experience, from co-founding India&apos;s early semiconductor companies to executing landmark private equity investments and leading turnarounds at global technology firms. The investment team combines deep scientific training, entrepreneurship, and operating experience across semiconductors, life sciences, AI, and other frontier tech. Several of us have founded companies, led acquisitions, and sat on the other side of the table.
        </p>
        <p className={styles.prowessText}>
          Our advisors, Lip-Bu Tan and Mathew Cyriac, have built and backed some of the most significant tech companies of the last three decades. Their counsel shapes how we think about what endures.
        </p>
        <p className={styles.prowessText}>
          Supporting the firm is an operations team with deep experience in fund administration, compliance, and finance: the kind of institutional rigour that early-stage deep tech companies rarely get, but always need.
        </p>
      </div>

      {/* ── OPERATIONS ── */}
      <div className={styles.opsSection}>
        <p className={styles.sectionLabel}>Operations</p>
        <div className={styles.opsGrid}>
          {operationsDisplay.map((member) => {
            const href = memberHref(member);
            const inner = (
              <>
                {member.photo ? (
                  <Image
                    src={member.photo}
                    alt={member.name}
                    width={32}
                    height={32}
                    className={styles.opsPhoto}
                  />
                ) : (
                  <div className={styles.opsPhoto} />
                )}
                <div>
                  <strong className={styles.opsName}>{member.name}</strong>
                  <span className={styles.opsRole}>{member.role}</span>
                </div>
              </>
            );
            return href ? (
              <Link key={member._id} href={href} className={styles.opsCell}>
                {inner}
              </Link>
            ) : (
              <div key={member._id} className={styles.opsCell}>
                {inner}
              </div>
            );
          })}
        </div>
      </div>

    </section>
  );
}
