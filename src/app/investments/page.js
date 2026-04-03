import React from 'react';
import styles from '../about-yali/about-styles.module.css';
import invStyles from './investments.module.css';
import { InvestmentsGraphic } from '../components/icons/background svgs/investmentsGraphic';
import { getCompanies } from '@/lib/sanity-queries';
import { getSiteStats } from '@/lib/site-stats';
import Image from 'next/image';
import Link from 'next/link';
import Button from '../components/button';
import HeaderFlex from '../components/icons/headerflex';
import { ThesisRows } from './thesis-rows';
export const revalidate = 60;

export const metadata = {
  title: 'Our Investments | Deep Tech Venture Capital in India',
  description: 'Deep tech venture capital investments in India. Specializing in robotics, AI, semiconductors, genomics and more. Bangalore-based VC firm backing India\'s tech startups.',
  keywords: 'deep tech venture capital, tech investing in India, bangalore venture capital, robotics investing, AI investing, semiconductor investing',
  alternates: {
    canonical: 'https://yali.vc/investments/',
  },
};

const THESIS = [
  {
    sector: 'Life Sciences',
    headline: 'Genomics and precision medicine represent a generational shift.',
    body: "Indian clinical data is underrepresented globally. That's the opportunity.",
    stat: '$150B+',
    statLabel: 'India cancer care market by 2030',
    companyNames: ['4baseCare'],
    isOdd: true,
  },
  {
    sector: 'Robotics',
    headline: 'Dextrous automation is at a genuine inflection point.',
    body: "The race is for the software stack, not the hardware shell. That's where moats are built.",
    stat: '$39B',
    statLabel: 'Figure AI valuation · 2025',
    companyNames: ['Perceptyne'],
    isOdd: false,
  },
  {
    sector: 'Fabless Semiconductor',
    headline: "India's chip design talent is world-class.",
    body: 'IP-driven, capital-efficient, globally scalable. 20% of global semiconductor design headcount is here.',
    stat: '$12.2B',
    statLabel: 'VC invested globally · 2025',
    companyNames: ['C2i'],
    isOdd: true,
  },
  {
    sector: 'Artificial Intelligence',
    headline: 'Not AI for its own sake.',
    body: 'AI as infrastructure enabling every other sector in this portfolio to compound.',
    stat: '1,700+',
    statLabel: 'GCCs in India driving AI demand',
    companyNames: ['LatentForce', 'PointAI'],
    isOdd: false,
  },
  {
    sector: 'Smart Manufacturing',
    headline: "India's manufacturing push creates a 10-year tailwind.",
    body: 'The investable gap is factory software, not hardware. IP-led startups build durable margins here.',
    stat: '$26B',
    statLabel: 'PLI investments realised · India',
    companyNames: ['Deeplase'],
    isOdd: true,
  },
  {
    sector: 'Aerospace & Surveillance',
    headline: 'Defence and dual-use tech at a strategic inflection.',
    body: "India's modernisation agenda and export ambitions are creating real demand, not just policy.",
    stat: '$9.1B',
    statLabel: 'India defence modernisation outlay',
    companyNames: ['Tonbo Imaging'],
    isOdd: false,
  },
];

function findCompany(name, companies) {
  return companies.find(
    (c) => c.name?.toLowerCase() === name.toLowerCase()
  );
}

function getCompanyHref(company) {
  const catSlug = company?.category?.slug?.current;
  const coSlug = company?.slug?.current;
  return company?.enableCompanyPage && catSlug && coSlug
    ? `/investments/${catSlug}/${coSlug}/`
    : null;
}

export default async function Investments() {
  let companies = [];
  let siteStats = { companyCount: 0, categoryCount: 0 };
  try {
    [companies, siteStats] = await Promise.all([
      getCompanies(),
      getSiteStats(),
    ]);
  } catch (error) {
    console.error('Failed to fetch data:', error);
  }

  return (
    <section className={styles.sectionLevel}>
      {/* HERO */}
      <div className={invStyles.hero}>
        <div className={invStyles.heroLeft}>
          <div>
            <p className={invStyles.heroTag}>Our Investments</p>
            <h1 className={invStyles.heroHeadline}>We back founders<br />leading from<br />the front.</h1>
            <p className={invStyles.heroSubhead}>We invest in deep tech companies with founders solving original problems, or just hard problems in new and original ways.</p>
          </div>
          <div className={invStyles.heroStats}>
            <div>
              <strong className={invStyles.statValue}>{siteStats.companyCount}</strong>
              <p className={invStyles.statLabel}>Portfolio companies</p>
            </div>
            <div>
              <strong className={invStyles.statValue}>6</strong>
              <p className={invStyles.statLabel}>Deep tech sectors</p>
            </div>
            <div>
              <strong className={invStyles.statValue}>Seed–A</strong>
              <p className={invStyles.statLabel}>Stage focus</p>
            </div>
          </div>
        </div>
        <div className={invStyles.heroRight}>
          <InvestmentsGraphic />
        </div>
      </div>

      {/* SECTOR THESIS */}
      <HeaderFlex title="Our investment thesis" color="black" desktopMaxWidth="60%" />
      <hr className={invStyles.thesisDivider} />
      <ThesisRows rows={THESIS} />

      {/* ALL PORTFOLIO COMPANIES */}
      <HeaderFlex title="All portfolio companies" color="black" desktopMaxWidth="60%" />
      <hr className={invStyles.thesisDivider} />
      <div className={invStyles.portfolioGrid}>
        {companies.map((company) => {
          const href = getCompanyHref(company);
          const cellContent = (
            <>
              {company.logo && (
                <Image
                  src={company.logo}
                  alt={company.name}
                  width={56}
                  height={56}
                  className={invStyles.portfolioLogo}
                />
              )}
              <div>
                <div className={invStyles.portfolioName}>{company.name}</div>
                <div className={invStyles.portfolioSector}>{company.category?.name}</div>
              </div>
            </>
          );

          return href ? (
            <Link
              key={company._id}
              href={href}
              className={`${invStyles.portfolioCell} ${invStyles.portfolioCellLink}`}
            >
              {cellContent}
            </Link>
          ) : (
            <div key={company._id} className={invStyles.portfolioCell}>
              {cellContent}
            </div>
          );
        })}
      </div>

      {/* CTA BAND */}
      <div className={invStyles.ctaBand}>
        <div>
          <div className={invStyles.ctaHeadline}>Building something in deep tech?</div>
          <p className={invStyles.ctaBody}>We back founders at the earliest stage. If you&apos;re working on a hard problem in one of our sectors, we want to hear from you.</p>
        </div>
        <Button href="/contact" color="#efefef">Get in touch ↗</Button>
      </div>
    </section>
  );
}
