'use client';

import { useState } from 'react';
import styles from './partners.module.css';

export default function CompanyGrid({ portfolioData }) {
  const [selectedCompany, setSelectedCompany] = useState(null);

  const getInitial = (name) => name ? name.charAt(0).toUpperCase() : '?';

  const formatCurrency = (value, decimals = 0) => {
    if (!value && value !== 0) return '-';
    return `₹${Number(value).toFixed(decimals)} Cr`;
  };

  const formatPercent = (value, decimals = 1) => {
    if (!value && value !== 0) return '-';
    return `${Number(value).toFixed(decimals)}%`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <>
      <div className={styles.companyGrid}>
        {portfolioData.map((item, index) => (
          <div
            key={item.company?._id || index}
            className={styles.companyCard}
            onClick={() => setSelectedCompany(item)}
            style={{ cursor: 'pointer' }}
          >
            {item.company?.logo ? (
              <img
                src={item.company.logo}
                alt={item.company.name}
                className={styles.companyLogo}
              />
            ) : (
              <div className={styles.companyLogoPlaceholder}>
                {getInitial(item.company?.name)}
              </div>
            )}
            <div className={styles.companyInfo}>
              <h3 className={styles.companyName}>{item.company?.name || 'Company'}</h3>
              <p className={styles.companyOneLiner}>{item.company?.oneLiner || item.company?.sector}</p>
              <div className={styles.companyMeta}>
                <span className={styles.companyMetaItem}>
                  Invested: <span className={styles.companyMetaValue}>{formatCurrency(item.investment?.yaliInvestmentAmount, 1)}</span>
                </span>
                <span className={styles.companyMetaItem}>
                  FMV: <span className={styles.companyMetaValue}>{formatCurrency(item.currentFMV, 1)}</span>
                </span>
                <span className={styles.companyMetaItem}>
                  Multiple: <span className={styles.companyMetaValue}>{item.multipleOfInvestment?.toFixed(2)}x</span>
                </span>
              </div>
              {item.updates?.length > 0 && (
                <ul className={styles.companyUpdates}>
                  {item.updates.slice(0, 2).map((update, i) => (
                    <li key={i}>{update}</li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {selectedCompany && (
        <div className={styles.modalOverlay} onClick={() => setSelectedCompany(null)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <button
              className={styles.modalClose}
              onClick={() => setSelectedCompany(null)}
              aria-label="Close"
            >
              &times;
            </button>

            <div className={styles.modalHeader}>
              {selectedCompany.company?.logo ? (
                <img
                  src={selectedCompany.company.logo}
                  alt={selectedCompany.company.name}
                  className={styles.modalLogo}
                />
              ) : (
                <div className={styles.modalLogoPlaceholder}>
                  {getInitial(selectedCompany.company?.name)}
                </div>
              )}
              <div className={styles.modalHeaderInfo}>
                <h2 className={styles.modalTitle}>{selectedCompany.company?.name}</h2>
                {selectedCompany.company?.sector && (
                  <span className={styles.modalSector}>{selectedCompany.company.sector}</span>
                )}
              </div>
            </div>

            <p className={styles.modalOneLiner}>{selectedCompany.company?.oneLiner}</p>

            {(selectedCompany.company?.detail || selectedCompany.investment?.reportDescription) && (
              <div style={{ marginBottom: '1.5rem' }}>
                <h4 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.75rem', opacity: 0.7 }}>About the Company</h4>
                <p className={styles.modalDescription}>{selectedCompany.investment?.reportDescription || selectedCompany.company?.detail}</p>
              </div>
            )}

            <div className={styles.modalMetricsGrid}>
              <div className={styles.modalMetric}>
                <span className={styles.modalMetricLabel}>Amount Invested</span>
                <span className={styles.modalMetricValue}>{formatCurrency(selectedCompany.investment?.yaliInvestmentAmount, 1)}</span>
              </div>
              <div className={styles.modalMetric}>
                <span className={styles.modalMetricLabel}>Current FMV</span>
                <span className={styles.modalMetricValue}>{formatCurrency(selectedCompany.currentFMV, 1)}</span>
              </div>
              <div className={styles.modalMetric}>
                <span className={styles.modalMetricLabel}>Multiple</span>
                <span className={styles.modalMetricValue}>{selectedCompany.multipleOfInvestment?.toFixed(2)}x</span>
              </div>
              <div className={styles.modalMetric}>
                <span className={styles.modalMetricLabel}>Ownership</span>
                <span className={styles.modalMetricValue}>{formatPercent(selectedCompany.currentOwnershipPercent)}</span>
              </div>
            </div>

            <div className={styles.modalDetails}>
              <div className={styles.modalDetailRow}>
                <span className={styles.modalDetailLabel}>Investment Date</span>
                <span className={styles.modalDetailValue}>{formatDate(selectedCompany.investment?.investmentDate)}</span>
              </div>
              <div className={styles.modalDetailRow}>
                <span className={styles.modalDetailLabel}>Funding Round</span>
                <span className={styles.modalDetailValue}>
                  {selectedCompany.investment?.fundingRound?.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || '-'}
                </span>
              </div>
              {selectedCompany.investment?.coInvestors?.length > 0 && (
                <div className={styles.modalDetailRow}>
                  <span className={styles.modalDetailLabel}>Co-Investors</span>
                  <span className={styles.modalDetailValue}>{selectedCompany.investment.coInvestors.join(', ')}</span>
                </div>
              )}
            </div>

            {(selectedCompany.investment?.preMoneyValuation || selectedCompany.investment?.totalRoundSize || selectedCompany.investment?.postMoneyValuation) && (
              <div style={{ marginTop: '1.5rem', marginBottom: '1.5rem' }}>
                <h4 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.75rem', opacity: 0.7 }}>Investment Round Details</h4>
                <div className={styles.modalDetails}>
                  {selectedCompany.investment?.preMoneyValuation && (
                    <div className={styles.modalDetailRow}>
                      <span className={styles.modalDetailLabel}>Pre-Money Valuation</span>
                      <span className={styles.modalDetailValue}>{formatCurrency(selectedCompany.investment.preMoneyValuation, 2)}</span>
                    </div>
                  )}
                  {selectedCompany.investment?.totalRoundSize && (
                    <div className={styles.modalDetailRow}>
                      <span className={styles.modalDetailLabel}>Total Round Size</span>
                      <span className={styles.modalDetailValue}>{formatCurrency(selectedCompany.investment.totalRoundSize, 2)}</span>
                    </div>
                  )}
                  {selectedCompany.investment?.postMoneyValuation && (
                    <div className={styles.modalDetailRow}>
                      <span className={styles.modalDetailLabel}>Post-Money Valuation</span>
                      <span className={styles.modalDetailValue}>{formatCurrency(selectedCompany.investment.postMoneyValuation, 2)}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {(selectedCompany.revenueINR || selectedCompany.patINR || selectedCompany.teamSize || selectedCompany.keyMetrics?.length > 0) && (
              <div style={{ marginTop: '1.5rem', marginBottom: '1.5rem' }}>
                <h4 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.75rem', opacity: 0.7 }}>Quarterly Financials & Metrics</h4>
                <div className={styles.modalDetails}>
                  {selectedCompany.revenueINR && (
                    <div className={styles.modalDetailRow}>
                      <span className={styles.modalDetailLabel}>Revenue (Quarterly)</span>
                      <span className={styles.modalDetailValue}>{formatCurrency(selectedCompany.revenueINR, 2)}</span>
                    </div>
                  )}
                  {selectedCompany.patINR && (
                    <div className={styles.modalDetailRow}>
                      <span className={styles.modalDetailLabel}>PAT (Quarterly)</span>
                      <span className={styles.modalDetailValue}>{formatCurrency(selectedCompany.patINR, 2)}</span>
                    </div>
                  )}
                  {selectedCompany.teamSize && (
                    <div className={styles.modalDetailRow}>
                      <span className={styles.modalDetailLabel}>Team Size</span>
                      <span className={styles.modalDetailValue}>{selectedCompany.teamSize} people</span>
                    </div>
                  )}
                  {selectedCompany.keyMetrics?.length > 0 && (
                    <div style={{ marginTop: '1rem' }}>
                      <div style={{ fontSize: '0.85rem', opacity: 0.7, marginBottom: '0.5rem' }}>Key Metrics:</div>
                      {selectedCompany.keyMetrics.map((metric, i) => (
                        <div key={i} className={styles.modalDetailRow}>
                          <span className={styles.modalDetailLabel}>{metric.label}</span>
                          <span className={styles.modalDetailValue}>{metric.value}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {selectedCompany.updates?.length > 0 && (
              <div className={styles.modalUpdates}>
                <h4 className={styles.modalUpdatesTitle}>Quarterly Updates</h4>
                <ul className={styles.modalUpdatesList}>
                  {selectedCompany.updates.map((update, i) => (
                    <li key={i}>{update}</li>
                  ))}
                </ul>
              </div>
            )}

            {selectedCompany.company?.link && (
              <a
                href={selectedCompany.company.link}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.modalLink}
              >
                Visit Website &rarr;
              </a>
            )}
          </div>
        </div>
      )}
    </>
  );
}
