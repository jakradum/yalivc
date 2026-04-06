import React from 'react';
import invStyles from './investments.module.css';
import { InvestmentsGraphic } from '../components/icons/background svgs/investmentsGraphic';
import { getCompanies } from '@/lib/sanity-queries';
import { getSiteStats } from '@/lib/site-stats';
import Image from 'next/image';
import Link from 'next/link';
import Button from '../components/button';
import HeaderFlex from '../components/icons/headerflex';
import separatorStyles from '../landing-page-styles/separator.module.css';
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
    index: '01',
    sector: 'Life Sciences',
    headline: 'The shift from healthcare service providers to healthcare innovation.',
    body: 'From cancer-care to medical devices, we are seeing the emergence of new and original ideas — often at a fraction of global costs — here in India.',
  },
  {
    index: '02',
    sector: 'Robotics',
    headline: "Intelligence gets into the physical world, and we're here for it.",
    body: 'From warehousing to defence to agriculture, the entry of physical AI devices and intelligence layers on existing infrastructure gives us the conviction needed to back companies in this space.',
  },
  {
    index: '03',
    sector: 'Fabless Semiconductor',
    headline: "We've always had the talent; we're now building for ourselves.",
    body: "Two-fifths of the global chip design workforce has come from India. We're now seeing that homegrown talent building IP-first companies that compete globally.",
  },
  {
    index: '04',
    sector: 'Artificial Intelligence',
    headline: 'A multi-moat approach to our most consequential tech.',
    body: "From sovereign AI to infrastructure, India is racing to build across the AI stack. Our conviction lies with founders who can translate AI's capability into real-world productivity gains across India's workforce.",
  },
  {
    index: '05',
    sector: 'Smart Manufacturing',
    headline: 'Manufacturing in 2026 needs a whole new thesis.',
    body: "In a world with fragile supply chains and economic shocks, we're counting on productivity gains through automation, shopfloor reliability & uptime, and intelligence layers that keep our manufacturing sector adaptable.",
  },
  {
    index: '06',
    sector: 'Aerospace & Surveillance',
    headline: 'The defence stack is slowly being built at home.',
    body: "From specialised components to full-system solutions, India's private defence industry is expanding fast. We've got the appetite, the talent, and the governmental support. All the industry needs is the right kind of capital.",
  },
];

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
    <section>
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
              <strong className={invStyles.statValue}>Early &amp; late stage</strong>
              <p className={invStyles.statLabel}>Stage focus</p>
            </div>
          </div>
        </div>
        <div className={invStyles.heroRight}>
          <InvestmentsGraphic />
        </div>
      </div>

      {/* MOBILE SECTOR TICKER */}
      <div className={invStyles.mobileTicker}>
        <div className={separatorStyles.containerWrapper}>
          <div className={invStyles.tickerTrack}>
            {[...Array(10)].flatMap(() => THESIS.map(r => r.sector)).map((sector, index) => (
              <React.Fragment key={`${sector}-${index}`}>
                {index > 0 && <span className={separatorStyles.separator}>·</span>}
                <span className={separatorStyles.technology}>{sector}</span>
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>

      {/* SECTOR THESIS */}
      <HeaderFlex title="Where we invest" color="black" desktopMaxWidth="60%" />
      <hr className={invStyles.thesisDivider} />
      <div className={invStyles.thesisTable}>
        {THESIS.map((row) => (
          <div key={row.sector} className={invStyles.thesisRow}>
            <p className={invStyles.thesisIndex}>{row.index}</p>
            <div className={invStyles.thesisContent}>
              <strong className={invStyles.thesisContentSector}>{row.sector}</strong>
              <h3 className={invStyles.thesisContentHeadline}>{row.headline}</h3>
              <p className={invStyles.thesisContentBody}>{row.body}</p>
            </div>
            <div className={invStyles.thesisTag}>
              <span className={invStyles.thesisTagText}>{row.sector}</span>
            </div>
          </div>
        ))}
      </div>

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
                {company.oneLiner && (
                  <p className={invStyles.portfolioOneLiner}>{company.oneLiner}</p>
                )}
                {href && (
                  <span className={invStyles.portfolioViewMore}>View more ↗</span>
                )}
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
        <h2 className={invStyles.ctaHeadline}>Building something in deep tech?</h2>
        <Button href="/contact" color="#efefef">Get in touch</Button>
      </div>
    </section>
  );
}
