import { notFound } from 'next/navigation';
import { getLPInvestmentByCompanySlug, getAllLPInvestmentSlugs, getLatestLPQuarterlyReport, getLPQuarterlyReportBySlug, getAvailableLPQuarters } from '@/lib/sanity-queries';
import CompanyDetailClient from './CompanyDetailClient';

export const revalidate = 0;
export const dynamic = 'force-dynamic';

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

export default async function CompanyPage({ params, searchParams }) {
  const { slug } = await params;
  const { report: reportSlug } = await searchParams;

  const [company, latestReport, allSlugs, availableQuarters] = await Promise.all([
    getLPInvestmentByCompanySlug(slug),
    getLatestLPQuarterlyReport(),
    getAllLPInvestmentSlugs(),
    getAvailableLPQuarters(),
  ]);

  if (!company) {
    notFound();
  }

  // Fetch selected report if specified, otherwise use latest
  let selectedReport = latestReport;
  if (reportSlug && reportSlug !== latestReport?.slug) {
    selectedReport = await getLPQuarterlyReportBySlug(reportSlug);
  }

  // Determine if viewing the latest report
  const isLatestReport = !reportSlug || reportSlug === latestReport?.slug;

  // Get current report period from selected report
  const currentReportPeriod = {
    quarter: selectedReport?.quarter || 'Q3',
    fiscalYear: selectedReport?.fiscalYear || 'FY26',
  };

  // Build ordered list of company slugs for next/prev navigation
  const allCompanySlugs = (allSlugs || [])
    .filter(item => item.slug)
    .map(item => ({ slug: item.slug, name: item.name }));

  return (
    <CompanyDetailClient
      company={company}
      currentReportPeriod={currentReportPeriod}
      allCompanySlugs={allCompanySlugs}
      reportSlug={reportSlug || null}
      allReports={availableQuarters || []}
      isLatestReport={isLatestReport}
    />
  );
}
