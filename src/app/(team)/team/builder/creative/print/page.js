import { requireDeckUser } from '@/decks/auth';
import { PrintClient } from './PrintClient';
import '@/decks/design-system/fonts.css';
import '@/decks/design-system/tokens.css';

export const metadata = { robots: 'noindex, nofollow' };
export const dynamic = 'force-dynamic';

// What Puppeteer visits to turn a creative asset into PNG/PDF (src/creative/export.js).
// Same sign-in guard as the studio; the asset itself is injected by the exporter
// as window.__creativeDoc and was already validated by the export route.
export default async function CreativePrintPage() {
  await requireDeckUser();
  return <PrintClient />;
}
