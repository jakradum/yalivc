import { requireTeamUser } from '@/decks/auth';
import { listInvitations } from '@/lib/pitch-invitations';
import { SignOutButton } from '../_components/SignOutButton';
import { Breadcrumbs, TEAM } from '../_components/Breadcrumbs';
import s from '../travel/travel.module.css';
import { InviteForm } from './InviteForm';

export const metadata = { title: 'Pitch invites | Yali Team', robots: 'noindex, nofollow' };
export const dynamic = 'force-dynamic';

// Pitch scheduler invitations: create a founder's one-time link and code, and see
// where each invitation stands. Replaces the Studio "Create invitation" button
// (invitations moved from Sanity to Supabase on 24 Nov 2026).
const TZ = 'Asia/Kolkata';
const when = (iso) => (iso ? new Date(iso).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hour12: false, timeZone: TZ }) : '');

function state(inv, now) {
  if (inv.status === 'submitted') return 'Slot picked';
  if (inv.status !== 'invited') return inv.status || 'Unknown';
  if (inv.expiresAt && new Date(inv.expiresAt).getTime() < now) return 'Expired';
  return inv.codeVerifiedAt ? 'Code entered' : 'Waiting';
}

export default async function PitchInvites() {
  const email = await requireTeamUser('pitch');
  const now = Date.now();
  let invitations = [];
  let failed = false;
  try {
    invitations = (await listInvitations()).sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')));
  } catch {
    failed = true;
  }

  return (
    <div className={s.page}>
      <div className={s.bar}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <a href="/team/"><img src="/favicon.svg" alt="Yali" /></a>
        <span className={s.divider} />
        <span className={s.barTitle}>Pitch invites</span>
        <span className={s.barRight}>{email}</span>
        <SignOutButton />
      </div>
      <Breadcrumbs trail={[TEAM, ['Pitch invites']]} />
      <main className={`${s.main} ${s.wide}`}>
        <h1 className={s.h1}>Pitch invites</h1>
        <p className={s.lede}>Creates a one-time link and code for a founder to pick a pitch slot. Email invitations are sent automatically; for WhatsApp or name-only, copy the message and send it yourself. Links last 48 hours.</p>
        <InviteForm />

        <section className={s.card}>
          <h2 className={s.cardTitle}>Invitations</h2>
          {failed ? <p className={s.empty}>Could not load invitations right now.</p> : invitations.length === 0 ? <p className={s.empty}>No invitations yet.</p> : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr>{['Company', 'Contact', 'Status', 'Picked slot', 'Created', 'Expires', 'Email'].map((h) => (
                    <th key={h} style={{ textAlign: 'left', fontWeight: 500, color: '#6b6b6b', fontSize: 12, padding: '8px 10px', borderBottom: '1px solid #363636', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}</tr>
                </thead>
                <tbody>
                  {invitations.map((inv) => {
                    const slot = (inv.slots || []).find((x) => x.slotId === inv.selectedSlotId);
                    const contact = inv.founderEmail || inv.whatsappNumber || inv.founderName || '';
                    const td = { padding: '8px 10px', borderBottom: '1px solid #e4e0da', verticalAlign: 'top' };
                    return (
                      <tr key={inv._id}>
                        <td style={{ ...td, fontWeight: 600 }}>{inv.companyName || '-'}</td>
                        <td style={td}>{contact}</td>
                        <td style={td}>{state(inv, now)}</td>
                        <td style={{ ...td, whiteSpace: 'nowrap' }}>{slot ? when(slot.startUTC) : ''}</td>
                        <td style={{ ...td, whiteSpace: 'nowrap' }}>{when(inv.createdAt)}</td>
                        <td style={{ ...td, whiteSpace: 'nowrap' }}>{when(inv.expiresAt)}</td>
                        <td style={td}>{inv.contactMethod === 'email' ? (inv.notificationStatus || '') : 'Sent by hand'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
      <Breadcrumbs trail={[TEAM, ['Pitch invites']]} position="bottom" />
    </div>
  );
}
