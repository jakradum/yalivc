'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import styles from '../../partners.module.css';
import { Lightlogo } from '../../../../components/icons/lightlogo';

export default function CompanyDetailClient({ company }) {
  const [showPreviousQuarters, setShowPreviousQuarters] = useState(false);

  const formatCurrency = (value, decimals = 2) => {
    if (!value && value !== 0) return '-';
    return `${Number(value).toFixed(decimals)}`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: '2-digit',
    });
  };

  const formatRound = (round) => {
    if (!round) return '-';
    return round.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const latestQuarter = company.latestQuarter || company.quarterlyUpdates?.[0];
  const previousQuarters = company.quarterlyUpdates?.slice(1) || [];

  return (
    <div className={styles.portalContainer}>
      {/* Header */}
      <header className={styles.portalHeader}>
        <div className={styles.headerLeft}>
          <Link href="/partners?section=portfolio-investment-summary" className={styles.logoLink}>
            <Lightlogo />
          </Link>
        </div>
        <div className={styles.headerRight}>
          <span className={styles.quarterLabel}>
            {latestQuarter?.quarter} {latestQuarter?.fiscalYear}
          </span>
        </div>
      </header>

      {/* Main Content */}
      <main className={styles.mainArea}>
        <section className={`${styles.contentSection} ${styles.companyDetailSection}`}>
          {/* Back Link */}
          <Link href="/partners?section=portfolio-investment-summary" className={styles.backLink}>
            <span className={styles.backLinkArrow}>←</span>
            Back to Portfolio
          </Link>

          {/* Company Header */}
          <div className={styles.companyDetailHeader}>
            {company.logo ? (
              <Image
                src={company.logo}
                alt={company.name}
                width={80}
                height={80}
                className={styles.companyDetailLogo}
              />
            ) : (
              <div className={styles.companyDetailLogoPlaceholder}>
                {company.name?.charAt(0) || '?'}
              </div>
            )}
            <div className={styles.companyDetailHeaderInfo}>
              <h1 className={styles.companyDetailName}>{company.name}</h1>
              <span className={styles.companyDetailSector}>{company.sector || '-'}</span>
            </div>
          </div>

          {/* Investment Details Table */}
          <table className={styles.investmentDetailsTable}>
            <tbody>
              <tr>
                <td>Date of first investment</td>
                <td>{formatDate(company.investmentDate)}</td>
              </tr>
              <tr>
                <td>Funding round</td>
                <td>{formatRound(company.fundingRound)}</td>
              </tr>
              <tr>
                <td>Total amount invested</td>
                <td>{formatCurrency(company.yaliInvestmentAmount)}</td>
              </tr>
              <tr>
                <td>Ownership fully diluted</td>
                <td>{company.yaliOwnershipPercent ? `${company.yaliOwnershipPercent.toFixed(2)}%` : '-'}</td>
              </tr>
              <tr>
                <td>FMV</td>
                <td>{formatCurrency(latestQuarter?.currentFMV || company.yaliInvestmentAmount)}</td>
              </tr>
              <tr>
                <td>Amount returned to investors</td>
                <td>{latestQuarter?.amountReturned ? formatCurrency(latestQuarter.amountReturned) : '-'}</td>
              </tr>
              <tr>
                <td>Multiple of investment</td>
                <td>{latestQuarter?.multipleOfInvestment?.toFixed(2) || '1.00'}</td>
              </tr>
              {company.coInvestors?.length > 0 && (
                <tr>
                  <td>Key co-investors</td>
                  <td>
                    <ol className={styles.coInvestorsList}>
                      {company.coInvestors.map((investor, idx) => (
                        <li key={idx}>{idx + 1}. {investor}</li>
                      ))}
                    </ol>
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* About Section */}
          {(company.detail || company.oneLiner) && (
            <div className={styles.companyAboutSection}>
              <h3 className={styles.companyAboutTitle}>About the Company</h3>
              <p className={styles.companyAboutText}>
                {company.detail || company.oneLiner}
              </p>
            </div>
          )}

          {/* Quarterly Updates Section */}
          {latestQuarter && (
            <div className={styles.quarterlyUpdatesSection}>
              <h2 className={styles.quarterlyUpdatesTitle}>
                Quarterly Updates for {latestQuarter.quarter} {latestQuarter.fiscalYear}
              </h2>

              <div className={styles.currentQuarterUpdate}>
                <div className={styles.quarterUpdateHeader}>
                  <span className={styles.quarterUpdatePeriod}>
                    {latestQuarter.quarter} {latestQuarter.fiscalYear}
                  </span>
                </div>

                <div className={styles.quarterUpdateMetrics}>
                  <div className={styles.quarterUpdateMetric}>
                    <span className={styles.quarterUpdateMetricLabel}>FMV</span>
                    <span className={styles.quarterUpdateMetricValue}>
                      ₹{formatCurrency(latestQuarter.currentFMV)} Cr
                    </span>
                  </div>
                  <div className={styles.quarterUpdateMetric}>
                    <span className={styles.quarterUpdateMetricLabel}>Multiple</span>
                    <span className={styles.quarterUpdateMetricValue}>
                      {latestQuarter.multipleOfInvestment?.toFixed(2) || '1.00'}x
                    </span>
                  </div>
                  {latestQuarter.revenueINR && (
                    <div className={styles.quarterUpdateMetric}>
                      <span className={styles.quarterUpdateMetricLabel}>Revenue</span>
                      <span className={styles.quarterUpdateMetricValue}>
                        ₹{formatCurrency(latestQuarter.revenueINR)} Cr
                      </span>
                    </div>
                  )}
                  {latestQuarter.teamSize && (
                    <div className={styles.quarterUpdateMetric}>
                      <span className={styles.quarterUpdateMetricLabel}>Team Size</span>
                      <span className={styles.quarterUpdateMetricValue}>
                        {latestQuarter.teamSize}
                      </span>
                    </div>
                  )}
                </div>

                {latestQuarter.updateNotes && (
                  <p className={styles.quarterUpdateNotes}>{latestQuarter.updateNotes}</p>
                )}

                {latestQuarter.highlights?.length > 0 && (
                  <ul className={styles.quarterUpdateHighlights}>
                    {latestQuarter.highlights.map((highlight, idx) => (
                      <li key={idx}>{highlight}</li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Previous Quarters (Collapsed) */}
              {previousQuarters.length > 0 && (
                <div className={styles.previousQuartersSection}>
                  <button
                    className={styles.previousQuartersToggle}
                    onClick={() => setShowPreviousQuarters(!showPreviousQuarters)}
                  >
                    <span className={`${styles.previousQuartersArrow} ${showPreviousQuarters ? styles.previousQuartersArrowOpen : ''}`}>
                      ▼
                    </span>
                    Previous Quarters ({previousQuarters.length})
                  </button>

                  {showPreviousQuarters && (
                    <div className={styles.previousQuartersList}>
                      {previousQuarters.map((quarter, idx) => (
                        <div key={idx} className={styles.previousQuarterItem}>
                          <div className={styles.previousQuarterHeader}>
                            <span className={styles.previousQuarterPeriod}>
                              {quarter.quarter} {quarter.fiscalYear}
                            </span>
                            <span className={styles.previousQuarterFMV}>
                              FMV: ₹{formatCurrency(quarter.currentFMV)} Cr
                            </span>
                          </div>
                          {quarter.updateNotes && (
                            <p className={styles.previousQuarterNotes}>{quarter.updateNotes}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Website Link */}
          {company.link && (
            <div style={{ marginTop: '2rem' }}>
              <a
                href={company.link}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.modalLink}
              >
                Visit Website →
              </a>
            </div>
          )}
        </section>
      </main>

      {/* Footer */}
      <footer className={styles.portalFooter}>
        <div className={styles.footerContent}>
          <span className={styles.footerText}>
            © {new Date().getFullYear()} Yali Capital. Confidential - For LP use only.
          </span>
          <div className={styles.footerLinks}>
            <a href="https://yali.vc" className={styles.footerLink}>Main Site</a>
            <Link href="/partners" className={styles.footerLink}>Back to Portal</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
