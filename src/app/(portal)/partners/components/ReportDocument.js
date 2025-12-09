'use client';

import styles from './report.module.css';

// Import section components
import ReportCoverNote from './ReportCoverNote';
import ReportFundSummary from './ReportFundSummary';
import ReportPortfolio from './ReportPortfolio';
import ReportCompanyUpdates from './ReportCompanyUpdates';
import ReportFinancials from './ReportFinancials';
import ReportPipeline from './ReportPipeline';
import ReportMedia from './ReportMedia';
import ReportContact from './ReportContact';

// Yali Logo SVG Component (from favicon)
const YaliLogo = ({ className }) => (
  <svg
    className={className}
    width="120"
    height="108"
    viewBox="0 0 40 40"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <g clipPath="url(#clip0_logo)">
      <path d="M28.2781 37.9966H27.9762C25.952 37.9966 23.9277 37.9943 21.9034 38C21.7191 38 21.5742 37.9628 21.4532 37.8186C21.3133 37.6509 21.1518 37.5004 21.016 37.3299C20.3432 36.4875 20.2758 35.5895 20.7906 34.6458C21.117 34.0472 21.5587 33.5373 22.0318 33.0537C23.1635 31.896 24.4128 30.8664 25.6124 29.7825C27.6292 27.9615 29.5279 26.0334 31.0876 23.7935C32.2222 22.1647 33.1558 20.4301 33.8447 18.565C33.876 18.4792 33.9149 18.3962 33.9696 18.2651C34.0336 18.482 33.9833 18.6406 33.9508 18.8002C33.9188 18.9588 33.8915 19.1179 33.8578 19.2758C33.3579 21.613 32.4259 23.7786 31.2286 25.8325C30.4485 27.1706 29.6244 28.4823 28.8294 29.8111C28.3215 30.6593 27.8621 31.5326 27.5236 32.466C26.8525 34.3173 27.0351 36.0708 28.1132 37.7242C28.1594 37.7952 28.2016 37.8684 28.2792 37.996L28.2781 37.9966Z" fill="currentColor"/>
      <path d="M22.8391 12.101C23.6244 12.5177 24.2356 13.0791 24.6391 13.8334C25.6149 15.6555 25.5071 17.4932 24.5346 19.2598C23.3938 21.331 21.5567 22.2415 19.2237 22.1991C18.604 22.1877 17.9939 22.0898 17.3981 21.9227C17.2257 21.8741 17.1247 21.9181 16.9952 22.0251C15.7499 23.0518 14.3323 23.2252 12.8091 22.8515C12.7543 22.8384 12.7024 22.8115 12.6516 22.7863C12.6294 22.7748 12.6128 22.7508 12.5609 22.701C13.0351 22.6902 13.4746 22.7142 13.9094 22.6392C14.4464 22.5465 14.9641 22.404 15.4383 22.127C15.8155 21.9067 16.1277 21.6194 16.3155 21.2182C16.3714 21.0992 16.425 21.0723 16.5654 21.0843C17.6572 21.1776 18.6833 20.9487 19.6175 20.3729C20.7281 19.6891 21.2714 18.6532 21.3929 17.3753C21.4318 16.9667 21.4146 16.5569 21.3884 16.1483C21.3598 15.7008 21.1607 15.3259 20.8736 14.998C19.9873 13.9862 18.8465 13.4516 17.5362 13.2657C16.2658 13.0854 15.105 13.3801 14.0647 14.1378C13.995 14.1882 13.942 14.2357 13.8398 14.1859C12.8411 13.7006 11.7961 13.7555 10.7432 13.9375C10.4196 13.9936 10.1 14.0714 9.72852 14.1504C10.0144 13.5913 10.2176 13.0419 10.536 12.548C10.6131 12.4284 10.7261 12.3729 10.8528 12.3219C12.239 11.7662 13.6566 11.7147 15.1045 12.0295C15.8452 12.1903 16.5803 12.3935 17.3467 12.4072C17.7502 12.4147 18.1485 12.3677 18.5189 12.2144C18.7324 12.1256 18.7763 12.2092 18.8203 12.3786C18.8899 12.6487 19.0154 12.8931 19.1906 13.1106C19.7488 13.8025 20.711 13.7996 21.2497 13.0951C21.3416 12.9749 21.4266 12.9103 21.5756 12.9332C21.6218 12.9406 21.6703 12.9332 21.7177 12.932C22.2741 12.9217 22.7461 12.7901 22.8391 12.1028V12.101Z" fill="currentColor"/>
      <path d="M13.8409 17.6133C13.4854 17.4766 13.2377 17.2454 13.0556 16.9386C12.8365 16.5706 12.7509 16.1637 12.7241 15.7414C12.7155 15.608 12.7281 15.469 12.5648 15.41C12.3919 15.3476 12.2276 15.378 12.0689 15.4547C11.9765 15.4993 12.0307 15.5577 12.0632 15.6166C12.1642 15.7992 12.2806 15.976 12.356 16.1689C12.6653 16.9592 12.3463 17.6843 11.5593 18.0065C10.5754 18.4094 9.58011 17.983 9.33015 17.0525C9.29248 16.9123 9.25424 16.7595 9.30047 16.6307C9.38094 16.4064 9.29191 16.2753 9.14809 16.1174C8.80682 15.7408 8.83878 15.3385 9.224 14.9928C9.69311 14.5716 10.2661 14.3885 10.8762 14.2889C11.969 14.1109 13.0328 14.1802 14.0538 14.642C14.1131 14.6689 14.1571 14.7009 14.233 14.6523C15.2106 14.0251 16.2989 13.8809 17.4277 13.9455C18.2906 13.9953 19.0776 14.2769 19.7773 14.7925C20.7161 15.4838 21.0071 16.2742 20.7389 17.4096C20.2532 19.4641 18.8237 20.5973 16.699 20.5738C16.3 20.5692 16.0147 20.6602 15.6974 20.9275C14.7306 21.7413 13.6046 22.19 12.3177 22.119C11.6905 22.0841 11.1661 21.8214 10.7877 21.3023C10.5851 21.0248 10.6022 20.8245 10.8744 20.6207C10.9926 20.532 11.0285 20.4725 10.9652 20.3277C10.8419 20.0467 10.9372 19.7875 11.1033 19.5511C11.2916 19.2827 11.549 19.0847 11.8024 18.8838C11.8441 18.8506 11.8891 18.7974 11.9525 18.8346C12.0124 18.8701 11.9941 18.9336 11.9896 18.9891C11.9628 19.3148 11.9725 19.637 12.1066 19.942C12.2298 20.2224 12.4313 20.4061 12.7458 20.445C12.8525 20.4582 12.9124 20.4336 12.8896 20.3088C12.7891 19.7674 13.1435 19.4441 13.4671 19.107C13.5042 19.0681 13.5493 19.0109 13.6121 19.0446C13.6754 19.0784 13.6497 19.1477 13.6355 19.1974C13.5841 19.3737 13.5664 19.5523 13.5795 19.7337C13.5921 19.9054 13.6623 20.0255 13.8569 20.0255C14.0766 20.0255 14.0932 19.8796 14.0829 19.7137C14.0646 19.4264 14.1177 19.1625 14.3403 18.9594C14.3785 18.925 14.4447 18.8896 14.4875 18.8993C14.5543 18.9153 14.536 18.9943 14.5292 19.0469C14.5081 19.2095 14.5052 19.3686 14.5617 19.5259C14.6319 19.7222 14.7426 19.7234 14.8779 19.5929C14.9184 19.554 14.9652 19.5088 14.9806 19.4578C15.0907 19.0956 15.2882 19.0853 15.6318 19.1894C16.4011 19.4224 17.139 19.277 17.793 18.7986C18.5235 18.264 18.9966 17.5441 19.2614 16.6817C19.3487 16.3967 19.3008 16.1798 19.0251 16.0041C17.6589 15.133 16.2281 15.0111 14.7306 15.6023C14.4727 15.7042 14.2484 15.8673 14.0595 16.0739C13.6908 16.4779 13.636 16.851 13.8421 17.6128L13.8409 17.6133Z" fill="currentColor"/>
      {/* Simplified for readability - includes all paths from favicon */}
    </g>
    <defs>
      <clipPath id="clip0_logo">
        <rect width="28" height="36" fill="white" transform="translate(6 2)"/>
      </clipPath>
    </defs>
  </svg>
);

export default function ReportDocument({ reportData }) {
  const data = reportData;

  const navItems = [
    { id: 'cover-note', label: 'Cover Note' },
    { id: 'fund-summary', label: 'Fund Summary' },
    { id: 'portfolio', label: 'Portfolio' },
    { id: 'companies', label: 'Companies' },
    { id: 'financials', label: 'Financials' },
    { id: 'pipeline', label: 'Pipeline' },
    { id: 'media', label: 'Media' },
    { id: 'contact', label: 'Contact' },
  ];

  const scrollToSection = (id) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Generate decorative dot pattern
  const generateDots = () => {
    const rows = [];
    const pattern = [
      [0, 0, 0, 1, 0, 0],
      [0, 0, 1, 0, 1, 0],
      [0, 1, 1, 0, 0, 0],
      [1, 0, 0, 1, 0, 1],
      [0, 1, 0, 0, 1, 0],
      [0, 0, 1, 0, 0, 0],
      [0, 0, 0, 1, 0, 0],
    ];

    pattern.forEach((row, rowIndex) => {
      rows.push(
        <div key={rowIndex} className={styles.dotRow}>
          {row.map((isHighlight, dotIndex) => (
            <span
              key={dotIndex}
              className={`${styles.dot} ${isHighlight ? styles.dotHighlight : ''}`}
            />
          ))}
        </div>
      );
    });

    return rows;
  };

  return (
    <div className={styles.reportViewer}>
      {/* Cover Section */}
      <div className={styles.coverSection}>
        <div className={styles.coverContent}>
          <div className={styles.coverLeft}>
            <h1 className={styles.coverLogo}>YALI</h1>
            <h2 className={styles.coverTitle}>Quarterly Report</h2>
            <p className={styles.coverSubtitle}>
              {data.cover.quarter} {data.cover.fiscalYear}
            </p>
            <p className={styles.coverFundName}>{data.cover.fundName}</p>
            <p className={styles.coverDate}>{data.cover.reportDate}</p>
          </div>
          <div className={styles.decorativeGraphic}>
            {generateDots()}
          </div>
        </div>
      </div>

      {/* Sticky Navigation */}
      <nav className={styles.reportNav}>
        <div className={styles.navContent}>
          {navItems.map((item) => (
            <span
              key={item.id}
              className={styles.navLink}
              onClick={() => scrollToSection(item.id)}
            >
              {item.label}
            </span>
          ))}
          <span className={styles.confidentialBadge}>Confidential</span>
        </div>
      </nav>

      {/* Content Container */}
      <div className={styles.reportContainer}>
        {/* Cover Note */}
        <ReportCoverNote
          id="cover-note"
          quarter={data.cover.quarter}
          fiscalYear={data.cover.fiscalYear}
          content={data.coverNote}
        />

        {/* Fund Summary */}
        <ReportFundSummary
          id="fund-summary"
          fundData={data.fundSummary}
        />

        {/* Portfolio Investments */}
        <ReportPortfolio
          id="portfolio"
          investments={data.portfolio}
        />

        {/* Company Updates - Now using portfolioData */}
        <ReportCompanyUpdates
          id="companies"
          portfolioData={data.portfolioData}
          companies={data.companies}
        />

        {/* Fund Financials */}
        <ReportFinancials
          id="financials"
          financials={data.financials}
        />

        {/* Pipeline Summary */}
        <ReportPipeline
          id="pipeline"
          pipeline={data.pipeline}
        />

        {/* Media Coverage */}
        <ReportMedia
          id="media"
          mediaItems={data.mediaCoverage || data.media}
        />

        {/* Contact */}
        <ReportContact
          id="contact"
          contact={data.contactInfo || data.contact}
        />
      </div>
    </div>
  );
}
