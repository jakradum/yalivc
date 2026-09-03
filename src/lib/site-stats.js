/**
 * site-stats.js
 * Central source of truth for main-site portfolio counts.
 * For use by main site frontend only — not dataroom or partner portal.
 */

import { client } from '@/sanity/client';

/**
 * Returns live counts derived from Sanity.
 * - companyCount: companies visible on main site (showOnMainWebsite == true)
 * - categoryCount: unique categories represented by those companies
 */
export async function getSiteStats() {
  const [companies, fundSettings] = await Promise.all([
    client.fetch(
      `*[_type == "company" && showOnMainWebsite == true]{ "category": category->name, investmentStatus }`
    ),
    client.fetch(`*[_type == "lpFundSettings"][0]{ collectiveExperience, location }`),
  ]);

  const list = companies || [];
  // "As of {date} our investments include N companies" must count only
  // companies Yali still holds — exclude exited (and written-off).
  const activeCount = list.filter(
    (c) => c.investmentStatus !== 'exited' && c.investmentStatus !== 'written-off'
  ).length;
  const unique = new Set(list.map((c) => c.category).filter(Boolean));

  return {
    companyCount: activeCount,
    categoryCount: unique.size,
    collectiveExperience: fundSettings?.collectiveExperience ?? 60,
    location: fundSettings?.location ?? 'Bangalore',
  };
}
