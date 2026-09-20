import { requireDeckUser } from '@/decks/auth';
import { CreativeClient } from './CreativeClient';
import '@/decks/design-system/fonts.css';
import '@/decks/design-system/tokens.css';

export const metadata = { robots: 'noindex, nofollow', title: 'Creative studio' };
export const dynamic = 'force-dynamic';

// Served at partners.yali.vc/builder/creative/ — linked from the builder home.
export default async function CreativePage() {
  await requireDeckUser();
  return <CreativeClient />;
}
