import { notFound, redirect } from 'next/navigation';
import { getLPInvestmentByCompanySlug, getAllLPInvestmentSlugs, getLatestLPQuarterlyReport, getLPQuarterlyReportBySlug, getAvailableLPQuarters } from '@/lib/sanity-queries';
import { getPortfolioCompaniesForQuarter } from '@/lib/quarterly-utils';
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

  // Filter companies by quarter using centralized quarterly logic
  // This is the single source of truth for what companies are visible in each quarter
  const companiesInScope = getPortfolioCompaniesForQuarter(
    allSlugs,
    currentReportPeriod.quarter,
    currentReportPeriod.fiscalYear
  );

  // Check if current company should be visible in this quarter
  // If not, redirect to the portfolio page (company was invested after this quarter)
  const isCompanyInScope = companiesInScope.some(c => c.slug === slug);
  if (!isCompanyInScope) {
    const redirectUrl = reportSlug
      ? `/partners?section=portfolio-company-updates&report=${reportSlug}`
      : '/partners?section=portfolio-company-updates';
    redirect(redirectUrl);
  }

  // Build ordered list of company slugs for next/prev navigation (filtered by quarter)
  const allCompanySlugs = companiesInScope
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
