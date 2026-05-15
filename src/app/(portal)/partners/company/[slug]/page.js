import { cookies } from 'next/headers';
import { notFound, redirect } from 'next/navigation';
import { getLPInvestmentByCompanySlug, getAllLPInvestmentSlugs, getLatestLPQuarterlyReport, getLPQuarterlyReportBySlug, getAvailableLPQuarters } from '@/lib/sanity-queries';
import { getPortfolioCompaniesForQuarter, filterInvestmentRounds, getQuarterEndDate, getNextQuarterEndDate, getEarliestInvestmentDate } from '@/lib/quarterly-utils';
import { verifySession } from '@/lib/session';
import CompanyDetailClient from './CompanyDetailClient';

export const revalidate = 0;
export const dynamic = 'force-dynamic';

// Check if user is internal (has @yali.vc email)
function isInternalUser(email) {
  if (!email) return false;
  return email.toLowerCase().endsWith('@yali.vc');
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

  // Get user access level from session — verify HMAC signature
  const cookieStore = await cookies();
  const cookieValue = cookieStore.get('portal-session')?.value;
  const userEmail = cookieValue ? verifySession(cookieValue) : null;
  // Cookie present but signature invalid → redirect to sign-in
  if (cookieValue && userEmail === null) redirect('/partners/sign-in');
  const hasInternalAccess = isInternalUser(userEmail);

  const [company, latestReport, allSlugs, availableQuarters] = await Promise.all([
    getLPInvestmentByCompanySlug(slug),
    getLatestLPQuarterlyReport(hasInternalAccess),
    getAllLPInvestmentSlugs(),
    getAvailableLPQuarters(),
  ]);

  // Filter available quarters based on user access
  const accessibleReports = (availableQuarters || []).filter(r =>
    hasInternalAccess ? true : r.visibility === 'published'
  );

  if (!company) {
    notFound();
  }

  // Fetch selected report if specified, otherwise use latest
  let selectedReport = latestReport;
  if (reportSlug && reportSlug !== latestReport?.slug) {
    selectedReport = await getLPQuarterlyReportBySlug(reportSlug);

    // Security check: if user doesn't have access to this report, fall back to latest accessible
    if (selectedReport && selectedReport.visibility === 'internal' && !hasInternalAccess) {
      selectedReport = latestReport;
    }
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

  // Build ordered list of company slugs for next/prev navigation.
  // Sort by initial investment date ascending — matches the portfolio investments table order.
  const allCompanySlugs = companiesInScope
    .filter(item => item.slug)
    .sort((a, b) => {
      const dateA = getEarliestInvestmentDate(a) || '';
      const dateB = getEarliestInvestmentDate(b) || '';
      if (!dateA && !dateB) return 0;
      if (!dateA) return 1;
      if (!dateB) return -1;
      return dateA < dateB ? -1 : dateA > dateB ? 1 : 0;
    })
    .map(item => ({ slug: item.slug, name: item.name }));

  // Filter investment rounds to only those on or before this quarter's end date
  const quarterEndDate = getQuarterEndDate(currentReportPeriod.quarter, currentReportPeriod.fiscalYear);
  const nextQuarterEndDate = getNextQuarterEndDate(currentReportPeriod.quarter, currentReportPeriod.fiscalYear);
  const filteredCompany = {
    ...company,
    investmentRounds: filterInvestmentRounds(
      company.investmentRounds || [],
      quarterEndDate,
      nextQuarterEndDate
    ),
  };

  return (
    <CompanyDetailClient
      company={filteredCompany}
      report={selectedReport}
      allCompanySlugs={allCompanySlugs}
      allReports={accessibleReports}
      isLatestReport={isLatestReport}
    />
  );
}
