/**
 * pdfRequestHandler.js
 * Shared GET handler for /api/generate-pdf/[slug].
 * Imported by both the top-level API route (production subdomain)
 * and the partners-prefixed route (local dev).
 */
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import {
  getLPFundSettings,
  getLPQuarterlyReportBySlugAdmin,
  getLPInvestmentsForPdf,
  getTeamMembers,
  getNewsForQuarter,
  getSocialUpdatesByDateRange,
} from '@/lib/sanity-queries';
import { buildReportData } from '@/lib/quarterly-utils';
import { generatePdfHtml } from '@/lib/generateQuarterlyPdf';
import {
  getCoverSvgHtml,
  getPortfolioUpdatesSvgHtml,
  getFundFinancialsSvgHtml,
  getPipelineSvgHtml,
} from '@/lib/pdf-svgs';

const AUTH_SECRET = process.env.PORTAL_AUTH_SECRET;
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

async function fetchAsDataUri(url) {
  if (!url || !url.startsWith('http')) return null;
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const buffer = await res.arrayBuffer();
    const mime = res.headers.get('content-type') || 'image/png';
    const b64 = Buffer.from(buffer).toString('base64');
    return `data:${mime};base64,${b64}`;
  } catch {
    return null;
  }
}

const QUARTER_END_MONTHS = { Q1: 'June', Q2: 'September', Q3: 'December', Q4: 'March' };

function quarterEndLabel(quarter, fiscalYear) {
  const fyNum = parseInt((fiscalYear || 'FY26').replace('FY', ''), 10);
  const fullYear = fyNum < 50 ? 2000 + fyNum : 1900 + fyNum;
  const month = QUARTER_END_MONTHS[quarter] || '';
  const year = quarter === 'Q4' ? fullYear : fullYear - 1;
  return `${month} ${year}`;
}

function fmtMonthYear(dateStr) {
  if (!dateStr) return null;
  return new Date(dateStr).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
}

async function verifyPortalSession(cookieValue) {
  if (!AUTH_SECRET || !cookieValue) return null;
  const parts = cookieValue.split(':');
  if (parts.length !== 3) return null;
  const [email, timestamp, signature] = parts;
  const sessionAge = Date.now() - parseInt(timestamp, 10);
  if (isNaN(sessionAge) || sessionAge > THIRTY_DAYS_MS || sessionAge < 0) return null;
  try {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(AUTH_SECRET),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(`${email}:${timestamp}`));
    const expectedSig = Array.from(new Uint8Array(sig))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    if (expectedSig.length !== signature.length) return null;
    let diff = 0;
    for (let i = 0; i < expectedSig.length; i++) {
      diff |= expectedSig.charCodeAt(i) ^ signature.charCodeAt(i);
    }
    return diff === 0 ? email : null;
  } catch {
    return null;
  }
}

export async function handlePdfGet(slug) {
  // ── Auth ────────────────────────────────────────────────────
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('portal-session')?.value;
  const email = await verifyPortalSession(sessionCookie);

  if (!email) {
    return new NextResponse('Unauthorized', { status: 401 });
  }
  const isInternalUser = email.endsWith('@yali.vc') || email.endsWith('@florintree.com') || email === 'pranavkarnad@gmail.com';
  if (!isInternalUser) {
    return new NextResponse('Forbidden — internal access only', { status: 403 });
  }
  if (!slug || typeof slug !== 'string') {
    return new NextResponse('Missing slug', { status: 400 });
  }

  // ── Fetch data ───────────────────────────────────────────────
  const [fundSettings, report, investments, teamMembers] = await Promise.all([
    getLPFundSettings(),
    getLPQuarterlyReportBySlugAdmin(slug),
    getLPInvestmentsForPdf(),
    getTeamMembers(),
  ]);

  if (!report) {
    return new NextResponse('Report not found', { status: 404 });
  }

  const { quarter, fiscalYear } = report;

  // Auto-pull news items for this quarter; fall back to manually-linked items
  const quarterNews = await getNewsForQuarter(quarter, fiscalYear);
  if (quarterNews && quarterNews.length > 0) {
    report.mediaFromNews = quarterNews;
  }

  // Pre-fetch all images as base64 so Puppeteer doesn't need to make network requests
  const imageFetches = [];
  if (fundSettings?.logoLight) {
    imageFetches.push(
      fetchAsDataUri(fundSettings.logoLight).then(uri => { if (uri) fundSettings.logoLight = uri; })
    );
  }
  for (const company of investments) {
    if (company.logo) {
      imageFetches.push(
        fetchAsDataUri(company.logo).then(uri => { if (uri) company.logo = uri; })
      );
    }
  }
  await Promise.all(imageFetches);

  const reportData = buildReportData({
    quarter,
    fiscalYear,
    fundSettings,
    investments,
    news: [],
    socialUpdates: [],
  });

  const { fundMetrics, portfolioCompanies, quarterStartDate, quarterEndDate } = reportData;

  // Fetch social updates for the quarter, then pre-fetch their images
  let quarterSocialUpdates = [];
  if (quarterStartDate && quarterEndDate) {
    try {
      quarterSocialUpdates = await getSocialUpdatesByDateRange(quarterStartDate, quarterEndDate) || [];
    } catch { quarterSocialUpdates = []; }
  }
  const socialImageFetches = quarterSocialUpdates
    .filter(u => u.imageUrl)
    .map(u => fetchAsDataUri(u.imageUrl).then(uri => { if (uri) u.imageUrl = uri; }));
  await Promise.all(socialImageFetches);

  const asOf = report.reportingDate
    ? fmtMonthYear(report.reportingDate)
    : quarterEndLabel(quarter, fiscalYear);

  const signatory = report.signatory ||
    teamMembers?.find(t =>
      t.name?.toLowerCase().includes('gani') ||
      t.name?.toLowerCase().includes('ganapathy')
    ) || { name: 'Ganapathy Subramaniam', role: 'Founding Managing Partner' };

  // ── Build HTML ───────────────────────────────────────────────
  const [coverSvgHtml, portfolioUpdatesSvgHtml, fundFinancialsSvgHtml, pipelineSvgHtml] =
    await Promise.all([
      getCoverSvgHtml(quarter),
      getPortfolioUpdatesSvgHtml(),
      getFundFinancialsSvgHtml(),
      getPipelineSvgHtml(),
    ]);

  const htmlContent = generatePdfHtml({
    quarter,
    fiscalYear,
    asOf,
    reportTitle: report.title || `LP Report ${quarter} ${fiscalYear} — Yali Capital`,
    fundSettings,
    fundMetrics,
    portfolioCompanies,
    report: { ...report, signatory },
    quarterSocialUpdates,
    coverSvgHtml,
    portfolioUpdatesSvgHtml,
    fundFinancialsSvgHtml,
    pipelineSvgHtml,
  });

  // ── Launch Puppeteer ─────────────────────────────────────────
  let browser;
  try {
    if (process.env.VERCEL) {
      const chromium = (await import('@sparticuz/chromium-min')).default;
      const puppeteer = (await import('puppeteer-core')).default;
      const CHROMIUM_URL =
        process.env.CHROMIUM_URL ||
        'https://github.com/Sparticuz/chromium/releases/download/v143.0.0/chromium-v143.0.0-pack.tar';
      browser = await puppeteer.launch({
        args: chromium.args,
        defaultViewport: chromium.defaultViewport,
        executablePath: await chromium.executablePath(CHROMIUM_URL),
        headless: true,
      });
    } else {
      const puppeteer = (await import('puppeteer')).default;
      browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });
    }

    const page = await browser.newPage();
    await page.setContent(htmlContent, { waitUntil: 'domcontentloaded', timeout: 15000 });

    // Correct page number badges by measuring actual rendered element heights.
    // Each .page div is exactly 1 physical page; each .company-ab-table/.media-page-table
    // may span multiple pages depending on content length.
    await page.evaluate(() => {
      const A4_HEIGHT = 1123;
      let physicalPage = 0;
      const pageEls = Array.from(document.querySelectorAll(
        '.page, .company-ab-table, .media-page-table'
      ));
      for (const el of pageEls) {
        const startPage = physicalPage + 1;
        physicalPage += Math.max(1, Math.ceil(el.offsetHeight / A4_HEIGHT));
        const badge = el.querySelector('.page-number');
        if (badge) {
          const span = badge.querySelector('span:not(.pn-tl):not(.pn-br)');
          if (span) span.textContent = `Page ${startPage}`;
        }
      }
    });

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '0', right: '0', bottom: '0', left: '0' },
    });

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${slug}.pdf"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (err) {
    console.error('[generate-pdf] Puppeteer error:', err);
    return new NextResponse('PDF generation failed', { status: 500 });
  } finally {
    if (browser) await browser.close().catch(() => {});
  }
}
