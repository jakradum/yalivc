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
  const categoryNames = await client.fetch(
    `*[_type == "company" && showOnMainWebsite == true][].category->name`
  );

  const unique = new Set((categoryNames || []).filter(Boolean));

  return {
    companyCount: categoryNames?.length ?? 0,
    categoryCount: unique.size,
  };
}
