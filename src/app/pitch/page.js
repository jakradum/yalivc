import { getCompanies } from '@/lib/sanity-queries';
import ForFoundersClient from './ForFoundersClient';

export const revalidate = 60;

export const metadata = {
  title: 'Pitch to Yali | Yali Capital',
  description: 'Pitch your deep tech startup to Yali Capital. We invest at seed and pre-Series A across life sciences, robotics, semiconductors, AI, smart manufacturing, and aerospace.',
  alternates: {
    canonical: 'https://yali.vc/pitch/',
  },
  openGraph: {
    title: 'Pitch to Yali | Yali Capital',
    description: 'Pitch your deep tech startup to Yali Capital. We invest at seed and pre-Series A across six deep tech sectors.',
    url: 'https://yali.vc/pitch/',
    type: 'website',
  },
};

export default async function ForFoundersPage() {
  const companies = await getCompanies();

  // Group by Sanity category name
  const companiesBySector = {};
  for (const c of companies) {
    const sector = c.category?.name;
    if (!sector) continue;
    if (!companiesBySector[sector]) companiesBySector[sector] = [];
    companiesBySector[sector].push({
      name: c.name,
      logo: c.logo,
      oneLiner: c.oneLiner,
      slug: c.slug?.current,
      categorySlug: c.category?.slug?.current,
      enableCompanyPage: c.enableCompanyPage,
    });
  }

  return <ForFoundersClient companiesBySector={companiesBySector} />;
}
