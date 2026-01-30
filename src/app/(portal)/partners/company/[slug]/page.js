import { notFound } from 'next/navigation';
import { getLPInvestmentByCompanySlug, getAllLPInvestmentSlugs, getLatestLPQuarterlyReport } from '@/lib/sanity-queries';
import CompanyDetailClient from './CompanyDetailClient';

export const revalidate = 60;

// Generate static params for all portfolio companies
export async function generateStaticParams() {
  const slugs = await getAllLPInvestmentSlugs();
  return slugs
    .filter(item => item.slug)
    .map((item) => ({
      slug: item.slug,
    }));
}

// Generate metadata
export async function generateMetadata({ params }) {
  const { slug } = await params;
  const company = await getLPInvestmentByCompanySlug(slug);

  if (!company) {
    return {
      title: 'Company Not Found | Partners Portal',
    };
  }

  return {
    title: `${company.name} | Partners Portal | Yali Capital`,
    description: company.oneLiner || `${company.name} - Portfolio Company`,
    robots: 'noindex, nofollow',
  };
}

export default async function CompanyPage({ params }) {
  const { slug } = await params;
  const [company, latestReport] = await Promise.all([
    getLPInvestmentByCompanySlug(slug),
    getLatestLPQuarterlyReport(),
  ]);

  if (!company) {
    notFound();
  }

  // Get current report period
  const currentReportPeriod = {
    quarter: latestReport?.quarter || 'Q3',
    fiscalYear: latestReport?.fiscalYear || 'FY26',
  };

  return <CompanyDetailClient company={company} currentReportPeriod={currentReportPeriod} />;
}
