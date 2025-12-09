'use client';

import styles from './report.module.css';

export default function ReportCompanyCard({ company, portfolioData }) {
  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-IN', {
      month: 'short',
      year: 'numeric',
    });
  };

  // Format currency
  const formatCurrency = (value) => {
    if (!value && value !== 0) return '-';
    return `₹${value} Cr`;
  };

  // Format percentage
  const formatPercent = (value) => {
    if (!value && value !== 0) return '-';
    return `${value}%`;
  };

  // Format multiple
  const formatMultiple = (value) => {
    if (!value && value !== 0) return '-';
    return `${value}x`;
  };

  // Get company initial for placeholder
  const getInitial = (name) => {
    return name ? name.charAt(0).toUpperCase() : '?';
  };

  // Use portfolioData if available (from Sanity), otherwise use legacy company prop
  const data = portfolioData || {};
  const companyInfo = data.company || company || {};

  return (
    <div className={styles.companyCard}>
      {/* Header with logo and company name */}
      <div className={styles.companyCardHeader}>
        {companyInfo.logo ? (
          <img
            src={companyInfo.logo}
            alt={companyInfo.name}
            className={styles.companyLogo}
          />
        ) : (
          <div className={styles.companyLogoPlaceholder}>
            {getInitial(companyInfo.name)}
          </div>
        )}
        <div className={styles.companyHeaderInfo}>
          <h3 className={styles.companyName}>{companyInfo.name}</h3>
          {companyInfo.oneLiner && (
            <p className={styles.companyTagline}>{companyInfo.oneLiner}</p>
          )}
        </div>
      </div>

      {/* Body with two columns */}
      <div className={styles.companyCardBody}>
        {/* Left Column - Investment Data Table */}
        <div>
          <table className={styles.companyDataTable}>
            <tbody>
              <tr>
                <td className={styles.companyDataLabel}>Date of first investment</td>
                <td className={styles.companyDataValue}>
                  {formatDate(data.dateOfFirstInvestment)}
                </td>
              </tr>
              <tr>
                <td className={styles.companyDataLabel}>Funding round</td>
                <td className={styles.companyDataValue}>
                  {data.fundingRound || '-'}
                </td>
              </tr>
              <tr>
                <td className={styles.companyDataLabel}>Total amount invested</td>
                <td className={styles.companyDataValue}>
                  {formatCurrency(data.totalAmountInvested)}
                </td>
              </tr>
              <tr>
                <td className={styles.companyDataLabel}>Ownership fully diluted</td>
                <td className={styles.companyDataValue}>
                  {formatPercent(data.ownershipFullyDiluted)}
                </td>
              </tr>
              <tr>
                <td className={styles.companyDataLabel}>FMV</td>
                <td className={styles.companyDataValue}>
                  {formatCurrency(data.fmv)}
                </td>
              </tr>
              <tr>
                <td className={styles.companyDataLabel}>Amount returned to investors</td>
                <td className={styles.companyDataValue}>
                  {data.amountReturnedToInvestors || '-'}
                </td>
              </tr>
              <tr>
                <td className={styles.companyDataLabel}>Multiple of investment</td>
                <td className={styles.companyDataValue}>
                  {formatMultiple(data.multipleOfInvestment)}
                </td>
              </tr>
              {data.keyCoInvestors && data.keyCoInvestors.length > 0 && (
                <tr>
                  <td className={styles.companyDataLabel}>Key co-investors</td>
                  <td className={styles.companyDataValue}>
                    {data.keyCoInvestors.join(', ')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Right Column - About the Company */}
        <div className={styles.companyAbout}>
          <h4 className={styles.companyAboutTitle}>About the company</h4>
          <p className={styles.companyAboutText}>
            {companyInfo.detail || companyInfo.oneLiner || 'Company description not available.'}
          </p>
          {companyInfo.category && (
            <p className={styles.companyAboutText} style={{ marginTop: '1rem', color: '#666' }}>
              <strong>Sector:</strong> {companyInfo.category.name}
            </p>
          )}
          {companyInfo.link && (
            <p className={styles.companyAboutText} style={{ marginTop: '0.5rem' }}>
              <a
                href={companyInfo.link}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: '#830D35', textDecoration: 'none' }}
              >
                Visit website →
              </a>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
